'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export function useRealtimeAssignments(eventId: string) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`event-assignments-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_assignments',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          // Invalidate relevant queries when assignments change
          queryClient.invalidateQueries({ queryKey: ['event-assignments', eventId] })
          queryClient.invalidateQueries({ queryKey: ['event', eventId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, queryClient, supabase])
}
