'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { createBoatSchema, type CreateBoatInput } from '@/lib/validations/boat'
import { createBoat } from '@/actions/boats'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

interface CreateBoatDialogProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateBoatDialog({ trigger, open, onOpenChange }: CreateBoatDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : internalOpen
  const setDialogOpen = isControlled ? onOpenChange! : setInternalOpen

  const form = useForm<CreateBoatInput>({
    resolver: zodResolver(createBoatSchema),
    defaultValues: {
      name: '',
      boatType: '',
      sailNumber: '',
      homePort: '',
      description: '',
    },
  })

  async function onSubmit(data: CreateBoatInput) {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.set('name', data.name)
      if (data.boatType) formData.set('boatType', data.boatType)
      if (data.sailNumber) formData.set('sailNumber', data.sailNumber)
      if (data.homePort) formData.set('homePort', data.homePort)
      if (data.description) formData.set('description', data.description)

      const result = await createBoat(formData)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Boat created successfully')
      form.reset()
      setDialogOpen(false)
      router.push(`/boats/${result.data.id}`)
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>
            <Plus />
            New Boat
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new boat</DialogTitle>
          <DialogDescription>
            Add your boat to start managing crew and events.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Boat name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Windchaser" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="boatType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Boat type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. J/70" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sailNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sail number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. USA 1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="homePort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Home port</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. San Francisco, CA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about the boat..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Boat'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
