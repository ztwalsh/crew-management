import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { CreateEventDialog } from '@/components/events/create-event-dialog'
import { EventsViewToggle } from '@/components/events/events-view-toggle'
import type { CrewRole } from '@/types'

export default async function EventsPage({
  params,
}: {
  params: Promise<{ boatId: string }>
}) {
  const { boatId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Verify membership
  const { data: membership } = await supabase
    .from('crew_memberships')
    .select('role')
    .eq('boat_id', boatId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) notFound()

  const userRole = membership.role as CrewRole
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin'

  // Fetch boat name
  const { data: boat } = await supabase
    .from('boats')
    .select('name')
    .eq('id', boatId)
    .single()

  if (!boat) notFound()

  // Fetch all events with assignment counts
  const now = new Date().toISOString()

  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('*, event_assignments(rsvp_status)')
    .eq('boat_id', boatId)
    .gte('start_time', now)
    .order('start_time', { ascending: true })

  const { data: pastEvents } = await supabase
    .from('events')
    .select('*, event_assignments(rsvp_status)')
    .eq('boat_id', boatId)
    .lt('start_time', now)
    .order('start_time', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground mt-1">{boat.name}</p>
        </div>
        {isOwnerOrAdmin && <CreateEventDialog boatId={boatId} />}
      </div>

      <EventsViewToggle
        upcomingEvents={(upcomingEvents || []) as any}
        pastEvents={(pastEvents || []) as any}
        boatId={boatId}
        isOwnerOrAdmin={isOwnerOrAdmin}
      />
    </div>
  )
}
