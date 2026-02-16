'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { eventTypeDotColors } from '@/lib/events'
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

interface EventsCalendarProps {
  upcomingEvents: EventRow[]
  pastEvents: EventRow[]
  boatId: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function EventsCalendar({ upcomingEvents, pastEvents, boatId }: EventsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))

  const allEvents = useMemo(
    () => [...upcomingEvents, ...pastEvents],
    [upcomingEvents, pastEvents]
  )

  // Map of date string -> events for that day
  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventRow[]>()
    for (const event of allEvents) {
      const dateKey = format(new Date(event.start_time), 'yyyy-MM-dd')
      const existing = map.get(dateKey) || []
      existing.push(event)
      map.set(dateKey, existing)
    }
    return map
  }, [allEvents])

  // Build the full grid of days (including overflow from prev/next months)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const gridStart = startOfWeek(monthStart)
    const gridEnd = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [currentMonth])

  const weeks = useMemo(() => {
    const result: Date[][] = []
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7))
    }
    return result
  }, [calendarDays])

  return (
    <div className="rounded-lg border border-border/50 bg-[#22252F] overflow-hidden">
      {/* Month header with navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h2 className="text-sm font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setCurrentMonth(new Date())}
          >
            <span className="text-xs">Today</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Weekday header row */}
      <div className="grid grid-cols-7 border-b border-border/50">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-1.5 text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {weeks.map((week, weekIdx) =>
          week.map((day, dayIdx) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayEvents = eventsByDay.get(dateKey) || []
            const inCurrentMonth = isSameMonth(day, currentMonth)
            const today = isToday(day)

            return (
              <div
                key={dateKey}
                className={`min-h-24 border-b border-r border-border/30 p-1 ${
                  !inCurrentMonth ? 'bg-[#1a1d25]' : ''
                } ${dayIdx === 6 ? 'border-r-0' : ''} ${
                  weekIdx === weeks.length - 1 ? 'border-b-0' : ''
                }`}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className={`inline-flex items-center justify-center text-xs leading-none ${
                      today
                        ? 'size-5 rounded-full bg-primary text-primary-foreground font-semibold'
                        : inCurrentMonth
                          ? 'text-foreground/80 px-0.5'
                          : 'text-muted-foreground/40 px-0.5'
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>

                {/* Event chips */}
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((event) => (
                    <Link
                      key={event.id}
                      href={`/boats/${boatId}/events/${event.id}`}
                      className={`group flex items-center gap-1 rounded px-1 py-0.5 text-[11px] leading-tight truncate transition-colors hover:bg-white/10 ${
                        !inCurrentMonth ? 'opacity-40' : ''
                      }`}
                    >
                      <span
                        className={`size-1.5 shrink-0 rounded-full ${eventTypeDotColors[event.event_type as EventType]}`}
                      />
                      <span className="truncate">
                        {event.all_day
                          ? event.title
                          : `${format(new Date(event.start_time), 'h:mma').toLowerCase()} ${event.title}`}
                      </span>
                    </Link>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="block px-1 text-[10px] text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
