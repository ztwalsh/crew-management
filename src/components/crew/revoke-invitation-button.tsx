'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { X, Loader2 } from 'lucide-react'
import { revokeInvitation } from '@/actions/invitations'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface RevokeInvitationButtonProps {
  invitationId: string
}

export function RevokeInvitationButton({
  invitationId,
}: RevokeInvitationButtonProps) {
  const [open, setOpen] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)

  async function handleRevoke() {
    setIsRevoking(true)
    try {
      const result = await revokeInvitation(invitationId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Invitation revoked')
        setOpen(false)
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="shrink-0 text-muted-foreground hover:text-destructive">
          <X className="size-4" />
          <span className="sr-only">Revoke</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke invitation?</DialogTitle>
          <DialogDescription>
            This will invalidate the invitation link. The recipient will no
            longer be able to use it to join the boat. You can always send a new
            invitation later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isRevoking}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRevoke}
            disabled={isRevoking}
          >
            {isRevoking && <Loader2 className="size-4 animate-spin" />}
            {isRevoking ? 'Revoking...' : 'Revoke Invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
