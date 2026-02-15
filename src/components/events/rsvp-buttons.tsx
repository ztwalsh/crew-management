'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, HelpCircle, X, Loader2 } from 'lucide-react'
import { updateRsvp } from '@/actions/events'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { RsvpStatus } from '@/types'

interface RsvpButtonsProps {
  assignmentId: string
  currentStatus: RsvpStatus
  onUpdate?: (status: RsvpStatus) => void
}

const rsvpOptions: {
  status: 'accepted' | 'tentative' | 'declined'
  label: string
  icon: typeof Check
  activeClass: string
  hoverClass: string
}[] = [
  {
    status: 'accepted',
    label: 'Yes',
    icon: Check,
    activeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30',
    hoverClass: 'hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30',
  },
  {
    status: 'tentative',
    label: 'Maybe',
    icon: HelpCircle,
    activeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30',
    hoverClass: 'hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30',
  },
  {
    status: 'declined',
    label: 'No',
    icon: X,
    activeClass: 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30',
    hoverClass: 'hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30',
  },
]

export function RsvpButtons({ assignmentId, currentStatus, onUpdate }: RsvpButtonsProps) {
  const [optimisticStatus, setOptimisticStatus] = useState<RsvpStatus>(currentStatus)
  const [isPending, startTransition] = useTransition()
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')

  function handleClick(status: 'accepted' | 'tentative' | 'declined') {
    const previousStatus = optimisticStatus

    // Optimistic update
    setOptimisticStatus(status)
    onUpdate?.(status)

    // If clicking the same status, toggle notes visibility
    if (previousStatus === status) {
      setShowNotes((prev) => !prev)
      return
    }

    // Show notes input for declined/tentative
    if (status === 'declined' || status === 'tentative') {
      setShowNotes(true)
    } else {
      setShowNotes(false)
    }

    startTransition(async () => {
      const result = await updateRsvp(assignmentId, status, notes || undefined)
      if (result.error) {
        // Revert optimistic update on error
        setOptimisticStatus(previousStatus)
        onUpdate?.(previousStatus)
        toast.error(result.error)
      }
    })
  }

  function handleNotesSubmit() {
    if (!notes.trim()) {
      setShowNotes(false)
      return
    }

    startTransition(async () => {
      const result = await updateRsvp(
        assignmentId,
        optimisticStatus as string,
        notes
      )
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Note added')
        setShowNotes(false)
      }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {rsvpOptions.map((option) => {
          const Icon = option.icon
          const isActive = optimisticStatus === option.status
          return (
            <Button
              key={option.status}
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleClick(option.status)}
              className={`gap-1.5 transition-all duration-200 ${
                isActive ? option.activeClass : option.hoverClass
              }`}
            >
              {isPending && optimisticStatus === option.status ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Icon className="size-3.5" />
              )}
              {option.label}
            </Button>
          )
        })}
      </div>

      {showNotes && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Add a note (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNotesSubmit()
              if (e.key === 'Escape') setShowNotes(false)
            }}
            className="h-8 text-sm bg-[#1A1D27]"
          />
          <Button
            size="xs"
            variant="ghost"
            onClick={handleNotesSubmit}
            disabled={isPending}
          >
            Save
          </Button>
        </div>
      )}
    </div>
  )
}
