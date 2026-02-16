'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { List, Calendar } from 'lucide-react'
import { CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EventsTable } from '@/components/events/events-table'
import { EventsCalendar } from '@/components/events/events-calendar'
import { CreateEventDialog } from '@/components/events/create-event-dialog'
import type { RsvpStatus } from '@/types'

type ViewMode = 'table' | 'calendar'

const STORAGE_KEY = 'events-view-preference'

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

interface EventsViewToggleProps {
  upcomingEvents: EventRow[]
  pastEvents: EventRow[]
  boatId: string
  isOwnerOrAdmin: boolean
}

export function EventsViewToggle({
  upcomingEvents,
  pastEvents,
  boatId,
  isOwnerOrAdmin,
}: EventsViewToggleProps) {
  const [view, setView] = useState<ViewMode>('table')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ViewMode | null
    if (stored === 'table' || stored === 'calendar') {
      setView(stored)
    }
    setMounted(true)
  }, [])

  function toggleView(newView: ViewMode) {
    setView(newView)
    localStorage.setItem(STORAGE_KEY, newView)
  }

  // Avoid hydration mismatch
  if (!mounted) return null

  const hasNoEvents = upcomingEvents.length === 0 && pastEvents.length === 0

  // Empty state — no events at all
  if (hasNoEvents) {
    return (
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
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex items-center rounded-lg border border-border/50 bg-[#22252F] p-0.5">
          <Button
            variant={view === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2"
            onClick={() => toggleView('table')}
          >
            <List className="size-4" />
            <span className="sr-only">Table view</span>
          </Button>
          <Button
            variant={view === 'calendar' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2"
            onClick={() => toggleView('calendar')}
          >
            <Calendar className="size-4" />
            <span className="sr-only">Calendar view</span>
          </Button>
        </div>
      </div>

      {view === 'table' ? (
        <EventsTable
          upcomingEvents={upcomingEvents}
          pastEvents={pastEvents}
          boatId={boatId}
        />
      ) : (
        <EventsCalendar
          upcomingEvents={upcomingEvents}
          pastEvents={pastEvents}
          boatId={boatId}
        />
      )}
    </div>
  )
}
