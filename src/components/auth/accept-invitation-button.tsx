'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'

interface AcceptInvitationButtonProps {
  token: string
}

export function AcceptInvitationButton({ token }: AcceptInvitationButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  async function handleAccept() {
    setIsLoading(true)
    try {
      // Look up the invitation
      const { data: invitation, error: fetchError } = await supabase
        .from('invitations')
        .select('id, boat_id, role, status, expires_at')
        .eq('token', token)
        .eq('status', 'pending')
        .single()

      if (fetchError || !invitation) {
        throw new Error('Invitation not found or already used')
      }

      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be signed in to accept an invitation')
      }

      // Create the crew membership
      const { error: membershipError } = await supabase
        .from('crew_memberships')
        .insert({
          boat_id: invitation.boat_id,
          user_id: user.id,
          role: invitation.role,
        })

      if (membershipError) {
        // Check for duplicate membership
        if (membershipError.code === '23505') {
          throw new Error('You are already a member of this boat')
        }
        throw membershipError
      }

      // Mark the invitation as accepted
      await supabase
        .from('invitations')
        .update({
          status: 'accepted' as const,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id)

      toast.success('Invitation accepted! Welcome aboard.')
      router.push('/boats')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept invitation')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      className="w-full"
      onClick={handleAccept}
      disabled={isLoading}
    >
      {isLoading ? 'Accepting...' : 'Accept Invitation'}
    </Button>
  )
}
