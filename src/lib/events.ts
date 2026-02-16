import { format, isToday, isTomorrow } from 'date-fns'
import type { EventType, RsvpStatus } from '@/types'

export const eventTypeColors: Record<EventType, string> = {
  race: 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30',
  practice: 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30',
  social: 'bg-[#A855F7]/15 text-[#A855F7] border-[#A855F7]/30',
  maintenance: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
  other: 'bg-[#8B8D97]/15 text-[#8B8D97] border-[#8B8D97]/30',
}

export const eventTypeDotColors: Record<EventType, string> = {
  race: 'bg-[#3B82F6]',
  practice: 'bg-[#22C55E]',
  social: 'bg-[#A855F7]',
  maintenance: 'bg-[#F59E0B]',
  other: 'bg-[#8B8D97]',
}

export function formatEventTime(startTime: string, endTime: string | null, allDay: boolean) {
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

export function getRsvpSummary(assignments: { rsvp_status: RsvpStatus }[]) {
  const counts = { accepted: 0, tentative: 0, declined: 0, pending: 0 }
  for (const a of assignments) {
    counts[a.rsvp_status] = (counts[a.rsvp_status] || 0) + 1
  }
  return counts
}
