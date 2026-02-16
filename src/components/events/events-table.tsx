'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { eventTypeColors, formatEventTime, getRsvpSummary } from '@/lib/events'
import type { EventType, RsvpStatus } from '@/types'

interface EventRow {
  id: string
  title: string
  event_type: string
  start_time: string
  end_time: string | null
  all_day: boolean
  location: string | null
  event_assignments: { rsvp_status: RsvpStatus }[]
}

interface EventsTableProps {
  upcomingEvents: EventRow[]
  pastEvents: EventRow[]
  boatId: string
}

function RsvpDots({ assignments }: { assignments: { rsvp_status: RsvpStatus }[] }) {
  const counts = getRsvpSummary(assignments)
  const total = assignments.length

  if (total === 0) return <span className="text-muted-foreground">—</span>

  return (
    <div className="flex items-center gap-2.5 text-xs">
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
    </div>
  )
}

function EventTableSection({
  events,
  boatId,
  isPast,
}: {
  events: EventRow[]
  boatId: string
  isPast?: boolean
}) {
  if (events.length === 0) return null

  return (
    <div className={`rounded-lg border border-border/50 bg-[#22252F] ${isPast ? 'opacity-75' : ''}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date / Time</TableHead>
            <TableHead className="hidden sm:table-cell">Location</TableHead>
            <TableHead>RSVP</TableHead>
            <TableHead className="text-right">Crew</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => {
            const totalCrew = event.event_assignments?.length || 0

            return (
              <TableRow key={event.id} className="group cursor-pointer">
                <TableCell>
                  <Link
                    href={`/boats/${boatId}/events/${event.id}`}
                    className="text-sm font-medium hover:text-[#0EA5E9] transition-colors"
                  >
                    {event.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-[10px] capitalize border ${eventTypeColors[event.event_type as EventType]}`}
                  >
                    {event.event_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {isPast
                    ? format(new Date(event.start_time), 'EEE, MMM d, yyyy')
                    : formatEventTime(event.start_time, event.end_time, event.all_day)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                  {event.location || '—'}
                </TableCell>
                <TableCell>
                  <RsvpDots assignments={event.event_assignments || []} />
                </TableCell>
                <TableCell className="text-right">
                  {totalCrew > 0 ? (
                    <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      <Users className="size-3" />
                      {totalCrew}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export function EventsTable({ upcomingEvents, pastEvents, boatId }: EventsTableProps) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Upcoming
        </h2>
        <EventTableSection events={upcomingEvents} boatId={boatId} />
        {upcomingEvents.length === 0 && (
          <p className="text-sm text-muted-foreground">No upcoming events.</p>
        )}
      </section>

      {pastEvents.length > 0 && (
        <section className="space-y-3">
          <Separator />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Past Events
          </h2>
          <EventTableSection events={pastEvents} boatId={boatId} isPast />
        </section>
      )}
    </div>
  )
}
