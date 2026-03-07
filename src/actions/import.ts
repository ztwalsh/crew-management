'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { can } from '@/lib/permissions'
import { parseCrewCSV, parseEventsCSV, type CrewImportRow, type EventImportRow } from '@/lib/csv-parser'
import { sendInvitationEmail } from '@/lib/email/send'
import type { CrewRole } from '@/types'

async function getAuthenticatedUserRole(boatId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const }

  const { data: membership } = await supabase
    .from('crew_memberships')
    .select('role')
    .eq('boat_id', boatId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) return { error: 'Not a member of this boat' as const }

  return { user, role: membership.role as CrewRole, supabase }
}

interface ImportCrewResult {
  invited: number
  skipped: number
  errors: string[]
}

export async function importCrew(
  boatId: string,
  csvText: string
): Promise<{ data?: ImportCrewResult; error?: string }> {
  const auth = await getAuthenticatedUserRole(boatId)
  if ('error' in auth && !('user' in auth)) return { error: auth.error }
  const { user, role, supabase } = auth as Exclude<typeof auth, { error: string }>

  if (!can(role, 'import')) {
    return { error: 'You do not have permission to import crew' }
  }

  // If input looks like plain emails (one per line, no commas in first line),
  // auto-prepend the header row so the parser can handle it
  const normalizedCsv = normalizeCrewInput(csvText)
  const parsed = parseCrewCSV(normalizedCsv)
  if (parsed.data.length === 0 && parsed.errors.length > 0) {
    return { error: parsed.errors[0].message }
  }
  if (parsed.data.length === 0) {
    return { error: 'No valid rows found in CSV' }
  }

  // Get boat name for emails
  const { data: boat } = await supabase
    .from('boats')
    .select('name')
    .eq('id', boatId)
    .single()

  // Get inviter name
  const { data: inviterProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Get existing crew emails to skip duplicates
  const { data: existingCrew } = await supabase
    .from('crew_memberships')
    .select('user_id, profiles(email)')
    .eq('boat_id', boatId)
    .eq('is_active', true)

  const existingEmails = new Set(
    (existingCrew ?? []).map((c: any) => c.profiles?.email?.toLowerCase()).filter(Boolean)
  )

  // Get existing pending invitations
  const { data: existingInvitations } = await supabase
    .from('invitations')
    .select('invited_email')
    .eq('boat_id', boatId)
    .eq('status', 'pending')

  const pendingEmails = new Set(
    (existingInvitations ?? []).map((i) => i.invited_email.toLowerCase())
  )

  let invited = 0
  let skipped = 0
  const errors: string[] = []

  // Deduplicate within the import itself
  const seen = new Set<string>()

  for (const row of parsed.data) {
    if (seen.has(row.email)) {
      skipped++
      continue
    }
    seen.add(row.email)

    if (existingEmails.has(row.email)) {
      skipped++
      continue
    }

    if (pendingEmails.has(row.email)) {
      skipped++
      continue
    }

    // Create invitation
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .insert({
        boat_id: boatId,
        invited_by: user.id,
        invited_email: row.email,
        role: row.role,
      })
      .select('token')
      .single()

    if (invError) {
      if (invError.code === '23505') {
        skipped++
      } else {
        errors.push(`${row.email}: ${invError.message}`)
      }
      continue
    }

    // Send email (don't block on failure)
    try {
      await sendInvitationEmail({
        to: row.email,
        inviterName: inviterProfile?.full_name || 'Someone',
        boatName: boat?.name || 'a boat',
        token: invitation.token,
        role: row.role,
      })
    } catch (e) {
      console.error(`Failed to send invitation email to ${row.email}:`, e)
    }

    invited++
  }

  // Add parsing errors to result
  for (const e of parsed.errors) {
    errors.push(`Row ${e.row}: ${e.message}`)
  }

  revalidatePath(`/boats/${boatId}/crew`)
  return { data: { invited, skipped, errors } }
}

interface ImportEventsResult {
  created: number
  errors: string[]
}

export async function importEvents(
  boatId: string,
  csvText: string
): Promise<{ data?: ImportEventsResult; error?: string }> {
  const auth = await getAuthenticatedUserRole(boatId)
  if ('error' in auth && !('user' in auth)) return { error: auth.error }
  const { user, role, supabase } = auth as Exclude<typeof auth, { error: string }>

  if (!can(role, 'import')) {
    return { error: 'You do not have permission to import events' }
  }

  const parsed = parseEventsCSV(csvText)
  if (parsed.data.length === 0 && parsed.errors.length > 0) {
    return { error: parsed.errors[0].message }
  }
  if (parsed.data.length === 0) {
    return { error: 'No valid rows found in CSV' }
  }

  // Get active crew for auto-assignment
  const { data: crewMembers } = await supabase
    .from('crew_memberships')
    .select('user_id, sailing_position')
    .eq('boat_id', boatId)
    .eq('is_active', true)

  let created = 0
  const errors: string[] = []

  for (const row of parsed.data) {
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        boat_id: boatId,
        title: row.title,
        description: row.description || null,
        event_type: row.event_type,
        location: row.location || null,
        start_time: row.start_time,
        end_time: row.end_time || null,
        all_day: row.all_day,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (eventError) {
      errors.push(`"${row.title}": ${eventError.message}`)
      continue
    }

    // Auto-assign crew
    if (crewMembers && crewMembers.length > 0) {
      const assignments = crewMembers.map((member) => ({
        event_id: event.id,
        user_id: member.user_id,
        sailing_position: member.sailing_position,
      }))

      await supabase.from('event_assignments').insert(assignments)
    }

    created++
  }

  // Add parsing errors to result
  for (const e of parsed.errors) {
    errors.push(`Row ${e.row}: ${e.message}`)
  }

  revalidatePath(`/boats/${boatId}/events`)
  return { data: { created, errors } }
}

/**
 * If the input looks like plain email addresses (one per line, no CSV headers),
 * auto-prepend an "email" header so the CSV parser can process it.
 */
function normalizeCrewInput(text: string): string {
  const trimmed = text.trim()
  const firstLine = trimmed.split('\n')[0].trim().toLowerCase()

  // If first line contains "email" it's already CSV with headers
  if (firstLine.includes('email')) return trimmed

  // If first line has commas, it might be CSV without headers — check if it looks like an email
  if (firstLine.includes(',')) return trimmed

  // Looks like plain emails, one per line. Wrap each as CSV.
  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean)
  return 'email\n' + lines.join('\n')
}
