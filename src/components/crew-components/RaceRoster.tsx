'use client'

import { Check, X, HelpCircle, Clock } from 'lucide-react'

interface RaceRosterProps {
  data: Record<string, unknown>
}

interface Assignment {
  name: string
  email: string
  position: string
  notes: string | null
}

interface Availability {
  accepted: Assignment[]
  declined: Assignment[]
  tentative: Assignment[]
  pending: Assignment[]
}

const STATUS_CONFIG = {
  accepted: { label: 'Going', color: '#22c55e', Icon: Check },
  declined: { label: 'Not Going', color: '#ef4444', Icon: X },
  tentative: { label: 'Maybe', color: '#f59e0b', Icon: HelpCircle },
  pending: { label: 'No Response', color: '#6b7280', Icon: Clock },
} as const

export function RaceRoster({ data }: RaceRosterProps) {
  const eventName = (data.event as string) || 'Event'
  const start = data.start as string
  const availability = (data.availability as Availability) || {
    accepted: [],
    declined: [],
    tentative: [],
    pending: [],
  }

  const total =
    availability.accepted.length +
    availability.declined.length +
    availability.tentative.length +
    availability.pending.length

  return (
    <div className="
      glass-card rounded-2xl
      bg-white/[0.03] border border-white/[0.08]
      backdrop-blur-md overflow-hidden
    ">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-1">
          <span className="size-2 rounded-full bg-[#f59e0b]" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">
            Roster
          </span>
        </div>
        <h3 className="text-sm font-medium text-[#e8e9ed]">{eventName}</h3>
        {start && (
          <p className="text-[11px] text-white/30 mt-0.5">
            {new Date(start).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>

      {/* RSVP summary bar */}
      {total > 0 && (
        <div className="px-4 py-2 flex gap-0.5 h-1.5">
          {availability.accepted.length > 0 && (
            <div
              className="rounded-full bg-[#22c55e]"
              style={{ width: `${(availability.accepted.length / total) * 100}%` }}
            />
          )}
          {availability.tentative.length > 0 && (
            <div
              className="rounded-full bg-[#f59e0b]"
              style={{ width: `${(availability.tentative.length / total) * 100}%` }}
            />
          )}
          {availability.declined.length > 0 && (
            <div
              className="rounded-full bg-[#ef4444]"
              style={{ width: `${(availability.declined.length / total) * 100}%` }}
            />
          )}
          {availability.pending.length > 0 && (
            <div
              className="rounded-full bg-[#6b7280]/30"
              style={{ width: `${(availability.pending.length / total) * 100}%` }}
            />
          )}
        </div>
      )}

      {/* Groups */}
      <div className="divide-y divide-white/[0.04]">
        {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(
          ([status, config]) => {
            const members = availability[status]
            if (members.length === 0) return null

            return (
              <div key={status} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <config.Icon
                    className="size-3"
                    style={{ color: config.color }}
                  />
                  <span
                    className="text-[10px] font-medium uppercase tracking-wider"
                    style={{ color: `${config.color}99` }}
                  >
                    {config.label}
                  </span>
                  <span className="text-[10px] text-white/20">{members.length}</span>
                </div>

                <div className="space-y-1.5 ml-5">
                  {members.map((member, i) => (
                    <div key={`${member.email}-${i}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-5 rounded-full bg-white/[0.06] flex items-center justify-center text-[8px] font-medium text-white/30 uppercase">
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-xs text-white/60">{member.name}</span>
                      </div>
                      {member.position && member.position !== 'unassigned' && (
                        <span className="text-[10px] text-white/20 capitalize">{member.position}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        )}
      </div>
    </div>
  )
}
