'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { UserPlus, Copy, Check, Loader2, Mail } from 'lucide-react'
import { createInvitationSchema } from '@/lib/validations/invitation'
import { createInvitation } from '@/actions/invitations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

interface InviteFormValues {
  boatId: string
  email: string
  role: 'admin' | 'crew'
}

interface InviteCrewDialogProps {
  boatId: string
  trigger?: React.ReactNode
}

export function InviteCrewDialog({ boatId, trigger }: InviteCrewDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(createInvitationSchema) as any,
    defaultValues: {
      boatId,
      email: '',
      role: 'crew',
    },
  })

  async function onSubmit(data: InviteFormValues) {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.set('boatId', data.boatId)
      formData.set('email', data.email)
      formData.set('role', data.role)

      const result = await createInvitation(formData)

      if (result.error) {
        toast.error(result.error)
        return
      }

      // Build the invite URL for sharing
      if (result.data?.token) {
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        setLastInviteUrl(`${origin}/invite/${result.data.token}`)
      }

      toast.success(`Invitation sent to ${data.email}`)
      form.reset({ boatId, email: '', role: 'crew' })
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCopyLink() {
    if (!lastInviteUrl) return
    try {
      await navigator.clipboard.writeText(lastInviteUrl)
      setCopied(true)
      toast.success('Invite link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset state when dialog closes
      form.reset({ boatId, email: '', role: 'crew' })
      setLastInviteUrl(null)
      setCopied(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button size="sm">
            <UserPlus className="size-4" />
            Invite Crew
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite crew member</DialogTitle>
          <DialogDescription>
            Send an email invitation to join this boat. They will receive a link
            to accept the invitation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="crew@example.com"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="crew">
                        Crew -- Can view events and RSVP
                      </SelectItem>
                      <SelectItem value="admin">
                        Admin -- Can manage crew and events
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden boatId field */}
            <input type="hidden" {...form.register('boatId')} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {isSubmitting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {/* Share link section -- shown after a successful invitation */}
        {lastInviteUrl && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Share invite link</p>
              <p className="text-xs text-muted-foreground">
                Or copy this link and share it directly.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={lastInviteUrl}
                  className="text-xs font-mono bg-[#1A1D27]"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
