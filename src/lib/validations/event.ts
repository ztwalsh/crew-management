import { z } from 'zod'

export const createEventSchema = z.object({
  boatId: z.string().uuid(),
  title: z.string().min(1, 'Event title is required').max(200),
  description: z.string().max(2000).optional(),
  eventType: z.enum(['race', 'practice', 'social', 'maintenance', 'other']),
  location: z.string().max(200).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  allDay: z.boolean().default(false),
})

export const updateEventSchema = createEventSchema.omit({ boatId: true }).partial()

export const updateRsvpSchema = z.object({
  assignmentId: z.string().uuid(),
  status: z.enum(['accepted', 'declined', 'tentative']),
  notes: z.string().max(500).optional(),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type UpdateRsvpInput = z.infer<typeof updateRsvpSchema>
