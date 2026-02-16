import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { RsvpButtons } from '@/components/events/rsvp-buttons'
import { AvailabilitySummary } from '@/components/events/availability-summary'
import { DeleteEventButton } from '@/components/events/delete-event-button'
import { EditEventDialog } from '@/components/events/edit-event-dialog'
import type { CrewRole, EventType, RsvpStatus } from '@/types'

const eventTypeColors: Record<EventType, string> = {
  race: 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30',
  practice: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30',
  social: 'bg-[#A855F7]/15 text-[#A855F7] border-[#A855F7]/30',
  maintenance: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
  other: 'bg-[#8B8D97]/15 text-[#8B8D97] border-[#8B8D97]/30',
}

const rsvpStatusConfig: Record<RsvpStatus, { label: string; color: string }> = {
  accepted: { label: 'Going', color: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30' },
  tentative: { label: 'Maybe', color: 'bg-amber-400/15 text-amber-400 border-amber-400/30' },
  declined: { label: 'Declined', color: 'bg-red-400/15 text-red-400 border-red-400/30' },
  pending: { label: 'Pending', color: 'bg-[#8B8D97]/15 text-[#8B8D97] border-[#8B8D97]/30' },
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ boatId: string; eventId: string }>
}) {
  const { boatId, eventId } = await params
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

  // Fetch event with assignments and profiles
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      event_assignments(
        id,
        user_id,
        rsvp_status,
        sailing_position,
        notes,
        responded_at,
        profiles(id, full_name, avatar_url)
      )
    `)
    .eq('id', eventId)
    .eq('boat_id', boatId)
    .single()

  if (error || !event) notFound()

  // Find the current user's assignment
  const assignments = (event.event_assignments as any[]) || []
  const userAssignment = assignments.find((a: any) => a.user_id === user.id)

  // Group assignments by status for display
  const groupedAssignments: Record<RsvpStatus, any[]> = {
    accepted: [],
    tentative: [],
    declined: [],
    pending: [],
  }

  for (const assignment of assignments) {
    const status = assignment.rsvp_status as RsvpStatus
    if (groupedAssignments[status]) {
      groupedAssignments[status].push(assignment)
    }
  }

  const eventDate = new Date(event.start_time)
  const isPastEvent = eventDate < new Date()

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back link */}
      <Link
        href={`/boats/${boatId}/events`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Events
      </Link>

      {/* Event header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
              <Badge
                variant="outline"
                className={`capitalize border ${eventTypeColors[event.event_type as EventType]}`}
              >
                {event.event_type}
              </Badge>
              {isPastEvent && (
                <Badge variant="outline" className="text-muted-foreground border-border/50">
                  Past
                </Badge>
              )}
            </div>

            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 shrink-0" />
                <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              {!event.all_day && (
                <div className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0" />
                  <span>
                    {format(eventDate, 'h:mm a')}
                    {event.end_time && ` - ${format(new Date(event.end_time), 'h:mm a')}`}
                  </span>
                </div>
              )}
              {event.all_day && (
                <div className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0" />
                  <span>All day</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 shrink-0" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin actions */}
          {isOwnerOrAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <EditEventDialog eventId={eventId} event={event} />
              <DeleteEventButton eventId={eventId} boatId={boatId} />
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {event.description}
          </p>
        )}
      </div>

      <Separator />

      {/* Current user's RSVP */}
      {userAssignment && !isPastEvent && (
        <Card className="bg-[#22252F] border-[#0EA5E9]/20">
          <CardHeader>
            <CardTitle className="text-base">Your RSVP</CardTitle>
          </CardHeader>
          <CardContent>
            <RsvpButtons
              assignmentId={userAssignment.id}
              currentStatus={userAssignment.rsvp_status as RsvpStatus}
            />
          </CardContent>
        </Card>
      )}

      {/* Availability summary */}
      <Card className="bg-[#22252F] border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilitySummary
            assignments={assignments.map((a: any) => ({
              rsvp_status: a.rsvp_status as RsvpStatus,
            }))}
          />
        </CardContent>
      </Card>

      {/* Crew assignments by status */}
      <Card className="bg-[#22252F] border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Crew ({assignments.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {(['accepted', 'tentative', 'pending', 'declined'] as RsvpStatus[]).map((status) => {
            const group = groupedAssignments[status]
            if (group.length === 0) return null

            const config = rsvpStatusConfig[status]

            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] border ${config.color}`}
                  >
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {group.length}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {group.map((assignment: any) => {
                    const profile = assignment.profiles
                    return (
                      <div
                        key={assignment.id}
                        className="flex items-center gap-3 rounded-lg border border-border/40 bg-[#1A1D27] p-3"
                      >
                        <Avatar size="sm">
                          {profile?.avatar_url && (
                            <AvatarImage
                              src={profile.avatar_url}
                              alt={profile.full_name}
                            />
                          )}
                          <AvatarFallback>
                            {getInitials(profile?.full_name ?? '??')}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                              {profile?.full_name ?? 'Unknown'}
                            </p>
                            {assignment.user_id === user.id && (
                              <span className="text-[10px] text-muted-foreground">(you)</span>
                            )}
                          </div>
                          {assignment.sailing_position && (
                            <p className="text-xs text-muted-foreground capitalize">
                              {assignment.sailing_position}
                            </p>
                          )}
                        </div>

                        {assignment.notes && (
                          <p className="text-xs text-muted-foreground italic max-w-[200px] truncate">
                            &ldquo;{assignment.notes}&rdquo;
                          </p>
                        )}

                        {assignment.responded_at && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {format(new Date(assignment.responded_at), 'MMM d')}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {assignments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No crew members assigned to this event.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
