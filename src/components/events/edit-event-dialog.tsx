'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { CalendarIcon, Pencil, Loader2 } from 'lucide-react'
import { updateEventSchema, type UpdateEventInput } from '@/lib/validations/event'
import { updateEvent } from '@/actions/events'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface EditEventDialogProps {
  eventId: string
  event: {
    title: string
    description: string | null
    event_type: string
    location: string | null
    start_time: string
    end_time: string | null
    all_day: boolean
  }
}

const eventTypes = [
  { value: 'race', label: 'Race' },
  { value: 'practice', label: 'Practice' },
  { value: 'social', label: 'Social' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
]

function getTimeString(isoDate: string): string {
  const date = new Date(isoDate)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

export function EditEventDialog({ eventId, event }: EditEventDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(event.start_time))
  const [endDate, setEndDate] = useState<Date | undefined>(
    event.end_time ? new Date(event.end_time) : undefined
  )
  const [startTime, setStartTime] = useState(getTimeString(event.start_time))
  const [endTime, setEndTime] = useState(event.end_time ? getTimeString(event.end_time) : '20:00')

  const form = useForm<UpdateEventInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(updateEventSchema) as any,
    defaultValues: {
      title: event.title,
      description: event.description ?? '',
      eventType: event.event_type as UpdateEventInput['eventType'],
      location: event.location ?? '',
      startTime: event.start_time,
      endTime: event.end_time ?? undefined,
      allDay: event.all_day,
    },
  })

  function buildDateTimeISO(date: Date, time: string): string {
    const [hours, minutes] = time.split(':').map(Number)
    const combined = new Date(date)
    combined.setHours(hours, minutes, 0, 0)
    return combined.toISOString()
  }

  // Sync start date/time into form
  useEffect(() => {
    if (startDate) {
      form.setValue('startTime', buildDateTimeISO(startDate, startTime))
    }
  }, [startDate, startTime]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync end date/time into form
  useEffect(() => {
    if (endDate) {
      form.setValue('endTime', buildDateTimeISO(endDate, endTime))
    } else {
      form.setValue('endTime', undefined)
    }
  }, [endDate, endTime]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: UpdateEventInput) {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      if (data.title) formData.set('title', data.title)
      if (data.description !== undefined) formData.set('description', data.description ?? '')
      if (data.eventType) formData.set('eventType', data.eventType)
      if (data.location !== undefined) formData.set('location', data.location ?? '')
      if (data.startTime) formData.set('startTime', data.startTime)
      if (data.endTime !== undefined) formData.set('endTime', data.endTime ?? '')

      const result = await updateEvent(eventId, formData)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Event updated successfully')
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit event</DialogTitle>
          <DialogDescription>
            Update the event details. Changes will be visible to all crew members.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Wednesday Night Race" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start date + time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Start date *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="size-4" />
                      {startDate ? format(startDate, 'MMM d, yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Start time *</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-[#1A1D27]"
                />
              </div>
            </div>

            {/* End date + time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">End date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="size-4" />
                      {endDate ? format(endDate, 'MMM d, yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">End time</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-[#1A1D27]"
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. San Francisco Yacht Club" {...field} />
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
                      placeholder="Any additional details about the event..."
                      className="resize-none bg-[#1A1D27]"
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
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
