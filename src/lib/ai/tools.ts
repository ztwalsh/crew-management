import { tool } from 'ai'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'

// Helper to get authenticated supabase client + user
async function getAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return { supabase, user }
}

// Helper to verify membership and get role
async function getMembership(supabase: any, userId: string, boatId: string) {
  const { data } = await supabase
    .from('crew_memberships')
    .select('role')
    .eq('boat_id', boatId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()
  if (!data) throw new Error('Not a member of this boat')
  return data.role as string
}

export function createTools(boatId: string) {
  return {
    list_crew: tool({
      description: 'List all active crew members on the current boat with their roles and positions',
      inputSchema: z.object({}),
      execute: async () => {
        const { supabase, user } = await getAuth()
        await getMembership(supabase, user.id, boatId)

        const { data, error } = await supabase
          .from('crew_memberships')
          .select('id, role, sailing_position, joined_at, profiles(full_name, email)')
          .eq('boat_id', boatId)
          .eq('is_active', true)
          .order('role')
          .order('joined_at')

        if (error) return { error: error.message }

        return {
          crew: (data ?? []).map((m: any) => ({
            name: m.profiles?.full_name || 'Unknown',
            email: m.profiles?.email || '',
            role: m.role,
            position: m.sailing_position || 'unassigned',
            joined: m.joined_at,
          })),
          total: data?.length ?? 0,
        }
      },
    }),

    list_events: tool({
      description: 'List upcoming and/or past events for the current boat',
      inputSchema: z.object({
        include_past: z.boolean().default(false).describe('Whether to include past events'),
        limit: z.number().default(20).describe('Max events to return'),
      }),
      execute: async ({ include_past, limit }) => {
        const { supabase, user } = await getAuth()
        await getMembership(supabase, user.id, boatId)

        const now = new Date().toISOString()

        let query = supabase
          .from('events')
          .select('id, title, event_type, start_time, end_time, location, all_day, description, event_assignments(rsvp_status)')
          .eq('boat_id', boatId)
          .order('start_time', { ascending: true })
          .limit(limit)

        if (!include_past) {
          query = query.gte('start_time', now)
        }

        const { data, error } = await query

        if (error) return { error: error.message }

        return {
          events: (data ?? []).map((e: any) => ({
            id: e.id,
            title: e.title,
            type: e.event_type,
            start: e.start_time,
            end: e.end_time,
            location: e.location,
            allDay: e.all_day,
            description: e.description,
            rsvpSummary: {
              accepted: e.event_assignments?.filter((a: any) => a.rsvp_status === 'accepted').length ?? 0,
              declined: e.event_assignments?.filter((a: any) => a.rsvp_status === 'declined').length ?? 0,
              tentative: e.event_assignments?.filter((a: any) => a.rsvp_status === 'tentative').length ?? 0,
              pending: e.event_assignments?.filter((a: any) => a.rsvp_status === 'pending').length ?? 0,
            },
          })),
          total: data?.length ?? 0,
        }
      },
    }),

    get_event_availability: tool({
      description: 'Get detailed RSVP/availability info for a specific event, showing who has accepted, declined, or not responded',
      inputSchema: z.object({
        event_id: z.string().describe('The event ID to check availability for'),
      }),
      execute: async ({ event_id }) => {
        const { supabase, user } = await getAuth()
        await getMembership(supabase, user.id, boatId)

        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('id, title, start_time, event_assignments(rsvp_status, notes, sailing_position, profiles(full_name, email))')
          .eq('id', event_id)
          .eq('boat_id', boatId)
          .single()

        if (eventError) return { error: eventError.message }

        const assignments = (event as any).event_assignments ?? []
        const grouped = {
          accepted: assignments.filter((a: any) => a.rsvp_status === 'accepted').map(formatAssignment),
          declined: assignments.filter((a: any) => a.rsvp_status === 'declined').map(formatAssignment),
          tentative: assignments.filter((a: any) => a.rsvp_status === 'tentative').map(formatAssignment),
          pending: assignments.filter((a: any) => a.rsvp_status === 'pending').map(formatAssignment),
        }

        return {
          event: event.title,
          start: event.start_time,
          availability: grouped,
        }
      },
    }),

    create_event: tool({
      description: 'Create a single event on the current boat. All active crew will be auto-assigned.',
      inputSchema: z.object({
        title: z.string().describe('Event title'),
        event_type: z.enum(['race', 'practice', 'social', 'maintenance', 'other']).describe('Type of event'),
        start_time: z.string().describe('ISO 8601 start time'),
        end_time: z.string().optional().describe('ISO 8601 end time (optional)'),
        location: z.string().optional().describe('Event location'),
        all_day: z.boolean().default(false).describe('Whether this is an all-day event'),
        description: z.string().optional().describe('Event description'),
      }),
      execute: async ({ title, event_type, start_time, end_time, location, all_day, description }) => {
        const { supabase, user } = await getAuth()
        const role = await getMembership(supabase, user.id, boatId)
        if (role === 'crew') return { error: 'You do not have permission to create events' }

        const { data: event, error } = await supabase
          .from('events')
          .insert({
            boat_id: boatId,
            title,
            event_type,
            start_time,
            end_time: end_time || null,
            location: location || null,
            all_day,
            description: description || null,
            created_by: user.id,
          })
          .select('id, title, start_time')
          .single()

        if (error) return { error: error.message }

        // Auto-assign crew
        const { data: crew } = await supabase
          .from('crew_memberships')
          .select('user_id, sailing_position')
          .eq('boat_id', boatId)
          .eq('is_active', true)

        if (crew && crew.length > 0) {
          await supabase.from('event_assignments').insert(
            crew.map((m: any) => ({
              event_id: event.id,
              user_id: m.user_id,
              sailing_position: m.sailing_position,
            }))
          )
        }

        return { success: true, event: { id: event.id, title: event.title, start: event.start_time } }
      },
    }),

    create_recurring_events: tool({
      description: 'Create a series of recurring events. Provide an array of events to create in batch.',
      inputSchema: z.object({
        events: z.array(z.object({
          title: z.string(),
          event_type: z.enum(['race', 'practice', 'social', 'maintenance', 'other']),
          start_time: z.string().describe('ISO 8601 start time'),
          end_time: z.string().optional(),
          location: z.string().optional(),
          all_day: z.boolean().default(false),
        })).describe('Array of events to create'),
      }),
      execute: async ({ events }) => {
        const { supabase, user } = await getAuth()
        const role = await getMembership(supabase, user.id, boatId)
        if (role === 'crew') return { error: 'You do not have permission to create events' }

        const { data: crew } = await supabase
          .from('crew_memberships')
          .select('user_id, sailing_position')
          .eq('boat_id', boatId)
          .eq('is_active', true)

        let created = 0
        const errors: string[] = []

        for (const evt of events) {
          const { data: event, error } = await supabase
            .from('events')
            .insert({
              boat_id: boatId,
              title: evt.title,
              event_type: evt.event_type,
              start_time: evt.start_time,
              end_time: evt.end_time || null,
              location: evt.location || null,
              all_day: evt.all_day,
              created_by: user.id,
            })
            .select('id')
            .single()

          if (error) {
            errors.push(`"${evt.title}": ${error.message}`)
            continue
          }

          if (crew && crew.length > 0) {
            await supabase.from('event_assignments').insert(
              crew.map((m: any) => ({
                event_id: event.id,
                user_id: m.user_id,
                sailing_position: m.sailing_position,
              }))
            )
          }

          created++
        }

        return { created, errors, total_requested: events.length }
      },
    }),

    invite_crew: tool({
      description: 'Invite one or more people to join the boat crew by email',
      inputSchema: z.object({
        invitations: z.array(z.object({
          email: z.string().email().describe('Email address to invite'),
          role: z.enum(['admin', 'crew']).default('crew').describe('Role to assign'),
        })).describe('Array of email/role pairs to invite'),
      }),
      execute: async ({ invitations }) => {
        const { supabase, user } = await getAuth()
        const role = await getMembership(supabase, user.id, boatId)
        if (role === 'crew') return { error: 'You do not have permission to invite crew' }

        let invited = 0
        let skipped = 0
        const errors: string[] = []

        for (const inv of invitations) {
          const { error } = await supabase
            .from('invitations')
            .insert({
              boat_id: boatId,
              invited_by: user.id,
              invited_email: inv.email.toLowerCase(),
              role: inv.role,
            })

          if (error) {
            if (error.code === '23505') {
              skipped++
            } else {
              errors.push(`${inv.email}: ${error.message}`)
            }
            continue
          }

          invited++
        }

        return { invited, skipped, errors }
      },
    }),

    update_rsvp: tool({
      description: "Update the current user's RSVP status for an event",
      inputSchema: z.object({
        event_id: z.string().describe('The event ID to RSVP for'),
        status: z.enum(['accepted', 'declined', 'tentative']).describe('RSVP status'),
        notes: z.string().optional().describe('Optional notes with the RSVP'),
      }),
      execute: async ({ event_id, status, notes }) => {
        const { supabase, user } = await getAuth()
        await getMembership(supabase, user.id, boatId)

        const { data, error } = await supabase
          .from('event_assignments')
          .update({
            rsvp_status: status,
            notes: notes || null,
            responded_at: new Date().toISOString(),
          })
          .eq('event_id', event_id)
          .eq('user_id', user.id)
          .select('id, rsvp_status, events(title)')
          .single()

        if (error) return { error: error.message }

        return {
          success: true,
          event: (data as any).events?.title,
          status: data.rsvp_status,
        }
      },
    }),

    delete_event: tool({
      description: 'Delete an event from the boat. This action cannot be undone.',
      inputSchema: z.object({
        event_id: z.string().describe('The event ID to delete'),
      }),
      execute: async ({ event_id }) => {
        const { supabase, user } = await getAuth()
        const role = await getMembership(supabase, user.id, boatId)
        if (role === 'crew') return { error: 'You do not have permission to delete events' }

        const { data: event } = await supabase
          .from('events')
          .select('title')
          .eq('id', event_id)
          .eq('boat_id', boatId)
          .single()

        if (!event) return { error: 'Event not found' }

        const { error } = await supabase.from('events').delete().eq('id', event_id)
        if (error) return { error: error.message }

        return { success: true, deleted: event.title }
      },
    }),

    import_crew_csv: tool({
      description: 'Import crew members from CSV text data. CSV should have headers: email, role, position',
      inputSchema: z.object({
        csv_text: z.string().describe('Raw CSV text with crew data'),
      }),
      execute: async ({ csv_text }) => {
        const { supabase, user } = await getAuth()
        const role = await getMembership(supabase, user.id, boatId)
        if (role === 'crew') return { error: 'You do not have permission to import crew' }

        const { importCrew } = await import('@/actions/import')
        return await importCrew(boatId, csv_text)
      },
    }),

    import_events_csv: tool({
      description: 'Import events from CSV text data. CSV should have headers: title, event_type, start_time, end_time, location, all_day',
      inputSchema: z.object({
        csv_text: z.string().describe('Raw CSV text with event data'),
      }),
      execute: async ({ csv_text }) => {
        const { supabase, user } = await getAuth()
        const role = await getMembership(supabase, user.id, boatId)
        if (role === 'crew') return { error: 'You do not have permission to import events' }

        const { importEvents } = await import('@/actions/import')
        return await importEvents(boatId, csv_text)
      },
    }),
  }
}

function formatAssignment(a: any) {
  return {
    name: a.profiles?.full_name || 'Unknown',
    email: a.profiles?.email || '',
    position: a.sailing_position || 'unassigned',
    notes: a.notes || null,
  }
}
