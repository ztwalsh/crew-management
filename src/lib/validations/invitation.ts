import { z } from 'zod'

export const createInvitationSchema = z.object({
  boatId: z.string().uuid(),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'crew']).default('crew'),
})

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
})

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>
