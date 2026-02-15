'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import type { SailingPosition } from '@/types'

export async function updateCrewMember(
  membershipId: string,
  data: { role?: 'admin' | 'crew'; sailing_position?: SailingPosition | null }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Fetch the membership to verify it exists and get the boat_id
  const { data: membership } = await supabase
    .from('crew_memberships')
    .select('boat_id, user_id, role')
    .eq('id', membershipId)
    .single()

  if (!membership) return { error: 'Crew member not found' }

  // Verify the current user is owner or admin on this boat
  const { data: currentUserMembership } = await supabase
    .from('crew_memberships')
    .select('role')
    .eq('boat_id', membership.boat_id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!currentUserMembership) return { error: 'You are not a member of this boat' }

  const currentRole = currentUserMembership.role
  if (currentRole !== 'owner' && currentRole !== 'admin') {
    return { error: 'Only owners and admins can update crew members' }
  }

  // Prevent modifying the owner's role
  if (membership.role === 'owner' && data.role) {
    return { error: 'Cannot change the owner role' }
  }

  // Admins cannot promote others to admin -- only owners can
  if (data.role === 'admin' && currentRole !== 'owner') {
    return { error: 'Only owners can promote members to admin' }
  }

  const { error } = await supabase
    .from('crew_memberships')
    .update(data)
    .eq('id', membershipId)

  if (error) return { error: error.message }

  revalidatePath(`/boats/${membership.boat_id}/crew`)
  revalidatePath(`/boats/${membership.boat_id}`)
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function removeCrewMember(membershipId: string, boatId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify the current user is owner or admin on this boat
  const { data: currentUserMembership } = await supabase
    .from('crew_memberships')
    .select('role')
    .eq('boat_id', boatId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!currentUserMembership) return { error: 'You are not a member of this boat' }

  const currentRole = currentUserMembership.role
  if (currentRole !== 'owner' && currentRole !== 'admin') {
    return { error: 'Only owners and admins can remove crew members' }
  }

  // Fetch the target membership to prevent removing the owner
  const { data: targetMembership } = await supabase
    .from('crew_memberships')
    .select('role, user_id')
    .eq('id', membershipId)
    .single()

  if (!targetMembership) return { error: 'Crew member not found' }

  if (targetMembership.role === 'owner') {
    return { error: 'Cannot remove the boat owner' }
  }

  // Admins cannot remove other admins
  if (targetMembership.role === 'admin' && currentRole !== 'owner') {
    return { error: 'Only owners can remove admins' }
  }

  const { error } = await supabase
    .from('crew_memberships')
    .update({ is_active: false })
    .eq('id', membershipId)

  if (error) return { error: error.message }

  revalidatePath(`/boats/${boatId}/crew`)
  revalidatePath(`/boats/${boatId}`)
  revalidatePath('/', 'layout')
  return { success: true }
}
