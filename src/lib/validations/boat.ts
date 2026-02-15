import { z } from 'zod'

export const createBoatSchema = z.object({
  name: z.string().min(1, 'Boat name is required').max(100),
  boatType: z.string().max(100).optional(),
  sailNumber: z.string().max(20).optional(),
  homePort: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
})

export const updateBoatSchema = createBoatSchema.partial()

export type CreateBoatInput = z.infer<typeof createBoatSchema>
export type UpdateBoatInput = z.infer<typeof updateBoatSchema>
