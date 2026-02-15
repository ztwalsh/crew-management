'use client'

import type { RsvpStatus } from '@/types'

interface AvailabilitySummaryProps {
  assignments: { rsvp_status: RsvpStatus }[]
}

const statusConfig: Record<RsvpStatus, { label: string; color: string; bgColor: string }> = {
  accepted: { label: 'Going', color: 'bg-emerald-400', bgColor: 'bg-emerald-400/10 text-emerald-400' },
  tentative: { label: 'Maybe', color: 'bg-amber-400', bgColor: 'bg-amber-400/10 text-amber-400' },
  declined: { label: 'Declined', color: 'bg-red-400', bgColor: 'bg-red-400/10 text-red-400' },
  pending: { label: 'Pending', color: 'bg-[#8B8D97]', bgColor: 'bg-[#8B8D97]/10 text-[#8B8D97]' },
}

export function AvailabilitySummary({ assignments }: AvailabilitySummaryProps) {
  const total = assignments.length
  if (total === 0) return null

  const counts: Record<RsvpStatus, number> = {
    accepted: 0,
    tentative: 0,
    declined: 0,
    pending: 0,
  }

  for (const a of assignments) {
    counts[a.rsvp_status] = (counts[a.rsvp_status] || 0) + 1
  }

  const responded = total - counts.pending

  return (
    <div className="space-y-3">
      {/* Status bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#1A1D27]">
        {(['accepted', 'tentative', 'declined', 'pending'] as RsvpStatus[]).map((status) => {
          const count = counts[status]
          if (count === 0) return null
          const pct = (count / total) * 100
          return (
            <div
              key={status}
              className={`${statusConfig[status].color} transition-all duration-300`}
              style={{ width: `${pct}%` }}
            />
          )
        })}
      </div>

      {/* Counts */}
      <div className="flex items-center gap-3 flex-wrap">
        {(['accepted', 'tentative', 'declined', 'pending'] as RsvpStatus[]).map((status) => {
          const count = counts[status]
          if (count === 0) return null
          const config = statusConfig[status]
          return (
            <div
              key={status}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bgColor}`}
            >
              <span className={`size-1.5 rounded-full ${config.color}`} />
              {count} {config.label}
            </div>
          )
        })}
      </div>

      {/* Responded text */}
      <p className="text-xs text-muted-foreground">
        {responded} of {total} responded
      </p>
    </div>
  )
}
