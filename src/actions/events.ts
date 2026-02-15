'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createEventSchema, updateRsvpSchema } from '@/lib/validations/event'

export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const raw = {
    boatId: formData.get('boatId') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string || undefined,
    eventType: formData.get('eventType') as string,
    location: formData.get('location') as string || undefined,
    startTime: formData.get('startTime') as string,
    endTime: formData.get('endTime') as string || undefined,
    allDay: formData.get('allDay') === 'true',
  }

  const result = createEventSchema.safeParse(raw)
  if (!result.success) return { error: result.error.issues[0].message }

  // Create the event
  const { data: event, error } = await supabase
    .from('events')
    .insert({
      boat_id: result.data.boatId,
      title: result.data.title,
      description: result.data.description || null,
      event_type: result.data.eventType,
      location: result.data.location || null,
      start_time: result.data.startTime,
      end_time: result.data.endTime || null,
      all_day: result.data.allDay,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Auto-assign all active crew members
  const { data: crewMembers } = await supabase
    .from('crew_memberships')
    .select('user_id, sailing_position')
    .eq('boat_id', result.data.boatId)
    .eq('is_active', true)

  if (crewMembers && crewMembers.length > 0) {
    const assignments = crewMembers.map(member => ({
      event_id: event.id,
      user_id: member.user_id,
      sailing_position: member.sailing_position,
    }))

    await supabase.from('event_assignments').insert(assignments)
  }

  revalidatePath(`/boats/${result.data.boatId}/events`)
  return { data: event }
}

export async function updateEvent(eventId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const updates: Record<string, any> = {}
  const title = formData.get('title') as string
  if (title) updates.title = title
  const description = formData.get('description') as string
  if (description !== null) updates.description = description || null
  const eventType = formData.get('eventType') as string
  if (eventType) updates.event_type = eventType
  const location = formData.get('location') as string
  if (location !== null) updates.location = location || null
  const startTime = formData.get('startTime') as string
  if (startTime) updates.start_time = startTime
  const endTime = formData.get('endTime') as string
  if (endTime !== null) updates.end_time = endTime || null

  const { data: event, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select('boat_id')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/boats/${event.boat_id}/events`)
  revalidatePath(`/boats/${event.boat_id}/events/${eventId}`)
  return { success: true }
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: event } = await supabase
    .from('events')
    .select('boat_id')
    .eq('id', eventId)
    .single()

  const { error } = await supabase.from('events').delete().eq('id', eventId)
  if (error) return { error: error.message }

  if (event) revalidatePath(`/boats/${event.boat_id}/events`)
  return { success: true }
}

export async function updateRsvp(assignmentId: string, status: string, notes?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = updateRsvpSchema.safeParse({ assignmentId, status, notes })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { data, error } = await supabase
    .from('event_assignments')
    .update({
      rsvp_status: parsed.data.status,
      notes: parsed.data.notes || null,
      responded_at: new Date().toISOString(),
    })
    .eq('id', assignmentId)
    .eq('user_id', user.id)
    .select('event_id, events(boat_id)')
    .single()

  if (error) return { error: error.message }

  const boatId = (data as any).events?.boat_id
  if (boatId) {
    revalidatePath(`/boats/${boatId}/events`)
  }
  return { success: true }
}
