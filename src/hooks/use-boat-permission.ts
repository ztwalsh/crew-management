'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export function useBoatPermission(boatId: string) {
  const supabase = createClient()

  const { data: membership } = useQuery({
    queryKey: ['membership', boatId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data } = await supabase
        .from('crew_memberships')
        .select('role')
        .eq('boat_id', boatId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()
      return data
    },
  })

  const role = membership?.role
  return {
    role,
    canManageCrew: role === 'owner' || role === 'admin',
    canEditEvents: role === 'owner' || role === 'admin',
    canDeleteBoat: role === 'owner',
    isMember: !!role,
  }
}
