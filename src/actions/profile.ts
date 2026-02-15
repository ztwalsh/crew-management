'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { updateProfileSchema, changePasswordSchema } from '@/lib/validations/profile'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const raw = {
    fullName: formData.get('fullName') as string,
    displayName: formData.get('displayName') as string || undefined,
    phone: formData.get('phone') as string || undefined,
    weightLbs: formData.get('weightLbs') as string || undefined,
    sailingExperience: formData.get('sailingExperience') as string || undefined,
    timezone: formData.get('timezone') as string || undefined,
  }

  const result = updateProfileSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: result.data.fullName,
      display_name: result.data.displayName || null,
      phone: result.data.phone || null,
      weight_lbs: result.data.weightLbs ? parseInt(result.data.weightLbs, 10) || null : null,
      sailing_experience: result.data.sailingExperience || null,
      timezone: result.data.timezone || null,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateAvatar(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('avatar') as File
  if (!file || file.size === 0) return { error: 'No file provided' }

  const fileExt = file.name.split('.').pop()
  const filePath = `${user.id}/avatar.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  // Append cache-busting timestamp
  const avatarUrl = `${publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (updateError) return { error: updateError.message }

  revalidatePath('/profile')
  revalidatePath('/', 'layout')
  return { success: true, avatarUrl }
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const raw = {
    newPassword: formData.get('newPassword') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const result = changePasswordSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { error } = await supabase.auth.updateUser({
    password: result.data.newPassword,
  })

  if (error) return { error: error.message }

  return { success: true }
}
