'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createInvitationSchema } from '@/lib/validations/invitation'
import { sendInvitationEmail } from '@/lib/email/send'

export async function createInvitation(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const raw = {
    boatId: formData.get('boatId') as string,
    email: formData.get('email') as string,
    role: (formData.get('role') as string) || 'crew',
  }

  const result = createInvitationSchema.safeParse(raw)
  if (!result.success) return { error: result.error.issues[0].message }

  // Check if the invited user is already an active crew member
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', result.data.email)
    .maybeSingle()

  if (existingProfile) {
    const { data: existingMember } = await supabase
      .from('crew_memberships')
      .select('id')
      .eq('boat_id', result.data.boatId)
      .eq('user_id', existingProfile.id)
      .eq('is_active', true)
      .maybeSingle()

    if (existingMember) {
      return { error: 'This person is already a crew member on this boat' }
    }
  }

  // Check for an existing pending invitation to this email for this boat
  const { data: existingInvitation } = await supabase
    .from('invitations')
    .select('id')
    .eq('boat_id', result.data.boatId)
    .eq('invited_email', result.data.email)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingInvitation) {
    return { error: 'An invitation has already been sent to this email' }
  }

  // Insert the invitation
  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      boat_id: result.data.boatId,
      invited_by: user.id,
      invited_email: result.data.email,
      role: result.data.role as 'admin' | 'crew',
    })
    .select('*, boats(name)')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'An invitation has already been sent to this email' }
    return { error: error.message }
  }

  // Get inviter name for the email
  const { data: inviterProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Send the invitation email
  try {
    await sendInvitationEmail({
      to: result.data.email,
      inviterName: inviterProfile?.full_name || 'Someone',
      boatName: (invitation as any).boats?.name || 'a boat',
      token: invitation.token,
      role: result.data.role as 'admin' | 'crew',
    })
  } catch (e) {
    // Email failure should not block invitation creation
    console.error('Failed to send invitation email:', e)
  }

  revalidatePath(`/boats/${result.data.boatId}/crew`)
  return { data: invitation }
}

export async function revokeInvitation(invitationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Look up the invitation to get the boat_id for revalidation
  const { data: invitation } = await supabase
    .from('invitations')
    .select('boat_id')
    .eq('id', invitationId)
    .single()

  const { error } = await supabase
    .from('invitations')
    .update({ status: 'expired' as const })
    .eq('id', invitationId)
    .eq('status', 'pending')

  if (error) return { error: error.message }

  if (invitation) {
    revalidatePath(`/boats/${invitation.boat_id}/crew`)
  }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function acceptInvitation(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Find the invitation by token
  const { data: invitation, error: findError } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (findError || !invitation) return { error: 'Invitation not found or expired' }

  // Check if the invitation has passed its expiry
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from('invitations')
      .update({ status: 'expired' as const })
      .eq('id', invitation.id)
    return { error: 'This invitation has expired' }
  }

  // Create the crew membership
  const { error: memberError } = await supabase
    .from('crew_memberships')
    .insert({
      boat_id: invitation.boat_id,
      user_id: user.id,
      role: invitation.role,
    })

  if (memberError) {
    if (memberError.code === '23505') {
      // User is already a member -- just accept the invitation
      await supabase
        .from('invitations')
        .update({ status: 'accepted' as const, accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)
      return { data: { boatId: invitation.boat_id, alreadyMember: true } }
    }
    return { error: memberError.message }
  }

  // Mark the invitation as accepted
  await supabase
    .from('invitations')
    .update({ status: 'accepted' as const, accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)

  revalidatePath('/', 'layout')
  return { data: { boatId: invitation.boat_id } }
}
