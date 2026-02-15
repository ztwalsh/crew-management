'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { updateBoatSchema, type UpdateBoatInput } from '@/lib/validations/boat'
import { updateBoat } from '@/actions/boats'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { Boat } from '@/types'

interface EditBoatFormProps {
  boat: Boat
}

export function EditBoatForm({ boat }: EditBoatFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<UpdateBoatInput>({
    resolver: zodResolver(updateBoatSchema),
    defaultValues: {
      name: boat.name,
      boatType: boat.boat_type ?? '',
      sailNumber: boat.sail_number ?? '',
      homePort: boat.home_port ?? '',
      description: boat.description ?? '',
    },
  })

  async function onSubmit(data: UpdateBoatInput) {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      if (data.name) formData.set('name', data.name)
      if (data.boatType !== undefined) formData.set('boatType', data.boatType ?? '')
      if (data.sailNumber !== undefined) formData.set('sailNumber', data.sailNumber ?? '')
      if (data.homePort !== undefined) formData.set('homePort', data.homePort ?? '')
      if (data.description !== undefined) formData.set('description', data.description ?? '')

      const result = await updateBoat(boat.id, formData)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Boat updated successfully')
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-[#22252F] border-border/50">
      <CardHeader>
        <CardTitle className="text-base">Boat Details</CardTitle>
        <CardDescription>
          Update your boat information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Boat name</FormLabel>
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
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
