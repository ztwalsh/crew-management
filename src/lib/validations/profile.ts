import { z } from 'zod'

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  displayName: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  weightLbs: z.string().optional(),
  sailingExperience: z.string().max(2000).optional(),
  timezone: z.string().max(100).optional(),
})

export const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
