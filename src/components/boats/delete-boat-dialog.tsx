'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteBoat } from '@/actions/boats'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface DeleteBoatDialogProps {
  boatId: string
  boatName: string
}

export function DeleteBoatDialog({ boatId, boatName }: DeleteBoatDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const isConfirmed = confirmation === boatName

  async function handleDelete() {
    if (!isConfirmed) return
    setIsDeleting(true)
    try {
      const result = await deleteBoat(boatId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Boat deleted successfully')
      setOpen(false)
      router.push('/boats')
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="size-4" />
          Delete Boat
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {boatName}?</DialogTitle>
          <DialogDescription>
            This will permanently delete the boat and all associated data including crew
            memberships, events, and assignments. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirm-name">
            Type <span className="font-semibold text-foreground">{boatName}</span> to confirm
          </Label>
          <Input
            id="confirm-name"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={boatName}
            autoComplete="off"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting && <Loader2 className="size-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Delete Boat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
