'use client'

import { Calendar, MapPin, Users, Clock } from 'lucide-react'

interface RaceCardProps {
  data: Record<string, unknown>
  toolName: string
}

interface EventData {
  id: string
  title: string
  type: string
  start: string
  end?: string
  location?: string
  allDay?: boolean
  description?: string
  rsvpSummary?: {
    accepted: number
    declined: number
    tentative: number
    pending: number
  }
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  race: '#ef4444',
  practice: '#0ea5e9',
  social: '#a855f7',
  maintenance: '#f59e0b',
  other: '#6b7280',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function RaceCard({ data, toolName }: RaceCardProps) {
  // Handle single event creation
  if (toolName === 'create_event' && data.event) {
    const evt = data.event as { id: string; title: string; start: string }
    return (
      <div className="
        glass-card rounded-2xl
        bg-white/[0.03] border border-white/[0.08]
        backdrop-blur-md p-4 max-w-sm
      ">
        <div className="flex items-center gap-2 mb-3">
          <span className="size-2 rounded-full bg-[#a855f7]" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">
            Event Created
          </span>
        </div>
        <h3 className="text-sm font-medium text-[#e8e9ed] mb-2">{evt.title}</h3>
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <Calendar className="size-3" />
          {formatDate(evt.start)} at {formatTime(evt.start)}
        </div>
      </div>
    )
  }

  // Handle event list
  const events = (data.events as EventData[]) || []

  if (events.length === 0) {
    return (
      <div className="
        glass-card rounded-2xl
        bg-white/[0.03] border border-white/[0.08]
        backdrop-blur-md p-4
      ">
        <div className="flex items-center gap-2 mb-3">
          <span className="size-2 rounded-full bg-[#a855f7]" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">
            Events
          </span>
        </div>
        <p className="text-xs text-white/30 text-center py-4">No events found</p>
      </div>
    )
  }

  // Single event → detailed card
  if (events.length === 1) {
    const evt = events[0]
    const color = EVENT_TYPE_COLORS[evt.type] || '#6b7280'

    return (
      <div className="
        glass-card rounded-2xl
        bg-white/[0.03] border border-white/[0.08]
        backdrop-blur-md p-5 max-w-sm
      ">
        <div className="flex items-center gap-2 mb-3">
          <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">
            {evt.type}
          </span>
        </div>

        <h3 className="text-sm font-medium text-[#e8e9ed] mb-3">{evt.title}</h3>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Calendar className="size-3.5 text-white/20" />
            {formatDate(evt.start)}
            {!evt.allDay && (
              <>
                {' '}at {formatTime(evt.start)}
                {evt.end && ` – ${formatTime(evt.end)}`}
              </>
            )}
          </div>

          {evt.location && (
            <div className="flex items-center gap-2 text-xs text-white/40">
              <MapPin className="size-3.5 text-white/20" />
              {evt.location}
            </div>
          )}

          {evt.rsvpSummary && (
            <div className="flex items-center gap-3 text-xs text-white/40 pt-1">
              <Users className="size-3.5 text-white/20" />
              <span className="text-green-400/60">{evt.rsvpSummary.accepted} yes</span>
              <span className="text-red-400/60">{evt.rsvpSummary.declined} no</span>
              <span className="text-yellow-400/60">{evt.rsvpSummary.tentative} maybe</span>
              {evt.rsvpSummary.pending > 0 && (
                <span className="text-white/20">{evt.rsvpSummary.pending} pending</span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Multiple events → compact list
  return (
    <div className="
      glass-card rounded-2xl
      bg-white/[0.03] border border-white/[0.08]
      backdrop-blur-md overflow-hidden
    ">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#a855f7]" />
          <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Events
          </span>
          <span className="text-xs text-white/25">{events.length}</span>
        </div>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {events.map((evt) => {
          const color = EVENT_TYPE_COLORS[evt.type] || '#6b7280'
          return (
            <div
              key={evt.id}
              className="px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="size-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-[#e8e9ed] truncate">{evt.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-white/30">
                    <span>{formatDate(evt.start)}</span>
                    {!evt.allDay && <span>{formatTime(evt.start)}</span>}
                    {evt.location && <span>· {evt.location}</span>}
                  </div>
                </div>

                {evt.rsvpSummary && (
                  <div className="flex items-center gap-1 text-[10px] text-white/20 shrink-0">
                    <span className="text-green-400/50">{evt.rsvpSummary.accepted}</span>
                    <span>/</span>
                    <span>
                      {evt.rsvpSummary.accepted + evt.rsvpSummary.declined + evt.rsvpSummary.tentative + evt.rsvpSummary.pending}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
