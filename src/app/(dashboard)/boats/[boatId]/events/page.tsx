import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { format, isToday, isTomorrow } from 'date-fns'
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CalendarPlus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CreateEventDialog } from '@/components/events/create-event-dialog'
import type { CrewRole, RsvpStatus, EventType } from '@/types'

const eventTypeColors: Record<EventType, string> = {
  race: 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30',
  practice: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30',
  social: 'bg-[#A855F7]/15 text-[#A855F7] border-[#A855F7]/30',
  maintenance: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
  other: 'bg-[#8B8D97]/15 text-[#8B8D97] border-[#8B8D97]/30',
}

function formatEventTime(startTime: string, endTime: string | null, allDay: boolean) {
  if (allDay) return 'All day'

  const start = new Date(startTime)
  let label = ''

  if (isToday(start)) {
    label = 'Today'
  } else if (isTomorrow(start)) {
    label = 'Tomorrow'
  } else {
    label = format(start, 'EEE, MMM d')
  }

  const timeStr = format(start, 'h:mm a')
  if (endTime) {
    const end = new Date(endTime)
    return `${label} at ${timeStr} - ${format(end, 'h:mm a')}`
  }

  return `${label} at ${timeStr}`
}

function getRsvpSummary(assignments: { rsvp_status: RsvpStatus }[]) {
  const counts = { accepted: 0, tentative: 0, declined: 0, pending: 0 }
  for (const a of assignments) {
    counts[a.rsvp_status] = (counts[a.rsvp_status] || 0) + 1
  }
  return counts
}

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

      {/* Upcoming events */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Upcoming
        </h2>
        {upcomingEvents && upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.map((event) => {
              const counts = getRsvpSummary(
                (event.event_assignments as { rsvp_status: RsvpStatus }[]) || []
              )
              const totalCrew = (event.event_assignments as any[])?.length || 0

              return (
                <Link
                  key={event.id}
                  href={`/boats/${boatId}/events/${event.id}`}
                >
                  <Card className="bg-[#22252F] border-border/50 transition-all duration-200 hover:border-[#0EA5E9]/30 hover:bg-[#22252F]/80 cursor-pointer">
                    <CardContent className="pt-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold truncate">
                              {event.title}
                            </h3>
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize border ${eventTypeColors[event.event_type as EventType]}`}
                            >
                              {event.event_type}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Clock className="size-3" />
                              {formatEventTime(event.start_time, event.end_time, event.all_day)}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="size-3" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* RSVP summary */}
                        {totalCrew > 0 && (
                          <div className="flex items-center gap-3 shrink-0 text-xs">
                            {counts.accepted > 0 && (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <span className="size-1.5 rounded-full bg-emerald-400" />
                                {counts.accepted}
                              </span>
                            )}
                            {counts.tentative > 0 && (
                              <span className="flex items-center gap-1 text-amber-400">
                                <span className="size-1.5 rounded-full bg-amber-400" />
                                {counts.tentative}
                              </span>
                            )}
                            {counts.declined > 0 && (
                              <span className="flex items-center gap-1 text-red-400">
                                <span className="size-1.5 rounded-full bg-red-400" />
                                {counts.declined}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Users className="size-3" />
                              {totalCrew}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <Card className="bg-[#22252F] border-border/50">
            <CardContent className="pt-0">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[#0EA5E9]/10 mb-4">
                  <CalendarPlus className="size-6 text-[#0EA5E9]" />
                </div>
                <p className="text-sm font-medium">No events yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isOwnerOrAdmin
                    ? 'Create your first event to get started.'
                    : 'No upcoming events have been scheduled.'}
                </p>
                {isOwnerOrAdmin && (
                  <div className="mt-4">
                    <CreateEventDialog
                      boatId={boatId}
                      trigger={
                        <button className="inline-flex items-center gap-1.5 rounded-md bg-[#0EA5E9] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0EA5E9]/90 transition-colors">
                          <CalendarPlus className="size-3.5" />
                          Create Event
                        </button>
                      }
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Past events */}
      {pastEvents && pastEvents.length > 0 && (
        <section className="space-y-3">
          <Separator />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Past Events
          </h2>
          <div className="space-y-2">
            {pastEvents.map((event) => {
              const counts = getRsvpSummary(
                (event.event_assignments as { rsvp_status: RsvpStatus }[]) || []
              )
              const totalCrew = (event.event_assignments as any[])?.length || 0

              return (
                <Link
                  key={event.id}
                  href={`/boats/${boatId}/events/${event.id}`}
                >
                  <Card className="bg-[#22252F]/60 border-border/30 transition-all duration-200 hover:border-border/50 cursor-pointer opacity-75 hover:opacity-100">
                    <CardContent className="pt-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-medium truncate">
                              {event.title}
                            </h3>
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize border ${eventTypeColors[event.event_type as EventType]}`}
                            >
                              {event.event_type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(event.start_time), 'EEE, MMM d, yyyy')}
                          </p>
                        </div>

                        {totalCrew > 0 && (
                          <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                            <Users className="size-3" />
                            {counts.accepted}/{totalCrew} went
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
