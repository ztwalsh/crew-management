'use client'

import { useState } from 'react'

interface ConfirmationBubbleProps {
  data: Record<string, unknown>
  toolName: string
}

function getSummary(data: Record<string, unknown>, toolName: string): string {
  switch (toolName) {
    case 'invite_crew': {
      const invited = data.invited as number
      const skipped = data.skipped as number
      if (invited === 1) return 'Invitation sent'
      if (invited > 1) return `${invited} invitations sent`
      if (skipped > 0) return `Already invited (${skipped} skipped)`
      return 'Invitations processed'
    }
    case 'update_rsvp':
      return `RSVP updated to ${data.status}`
    case 'delete_event':
      return `"${data.deleted}" removed`
    case 'create_recurring_events': {
      const created = data.created as number
      return `${created} event${created !== 1 ? 's' : ''} created`
    }
    default:
      if (data.success) return 'Done'
      return 'Completed'
  }
}

export function ConfirmationBubble({ data, toolName }: ConfirmationBubbleProps) {
  const [undone, setUndone] = useState(false)
  const summary = getSummary(data, toolName)
  const hasSuccess = Boolean(data.success)

  return (
    <div className="
      inline-flex items-center gap-3
      rounded-2xl
      bg-white/[0.04] border border-white/[0.06]
      px-4 py-2.5
    ">
      {/* Animated checkmark */}
      <div className="size-5 shrink-0">
        <svg viewBox="0 0 20 20" className="size-5">
          <circle
            cx="10" cy="10" r="9"
            fill="none"
            stroke="rgba(34, 197, 94, 0.2)"
            strokeWidth="1.5"
          />
          <path
            d="M6 10.5 L9 13.5 L14 7.5"
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="checkmark-draw"
          />
        </svg>
      </div>

      <span className="text-sm text-[#e8e9ed]/80">{summary}</span>

      {/* Undo button (decorative in POC) */}
      {!undone && hasSuccess && (
        <button
          onClick={() => setUndone(true)}
          className="text-xs text-white/25 hover:text-white/50 transition-colors ml-1"
        >
          Undo
        </button>
      )}

      {undone && (
        <span className="text-xs text-white/30 italic ml-1">Undone</span>
      )}
    </div>
  )
}
