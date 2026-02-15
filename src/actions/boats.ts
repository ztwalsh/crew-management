'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createBoatSchema, updateBoatSchema } from '@/lib/validations/boat'

export async function createBoat(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const raw = {
    name: formData.get('name') as string,
    boatType: formData.get('boatType') as string || undefined,
    sailNumber: formData.get('sailNumber') as string || undefined,
    homePort: formData.get('homePort') as string || undefined,
    description: formData.get('description') as string || undefined,
  }

  const result = createBoatSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { data, error } = await supabase
    .from('boats')
    .insert({
      name: result.data.name,
      boat_type: result.data.boatType || null,
      sail_number: result.data.sailNumber || null,
      home_port: result.data.homePort || null,
      description: result.data.description || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/boats')
  revalidatePath('/', 'layout')
  return { data }
}

export async function updateBoat(boatId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const raw = {
    name: formData.get('name') as string || undefined,
    boatType: formData.get('boatType') as string || undefined,
    sailNumber: formData.get('sailNumber') as string || undefined,
    homePort: formData.get('homePort') as string || undefined,
    description: formData.get('description') as string || undefined,
  }

  const result = updateBoatSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { error } = await supabase
    .from('boats')
    .update({
      name: result.data.name,
      boat_type: result.data.boatType,
      sail_number: result.data.sailNumber,
      home_port: result.data.homePort,
      description: result.data.description,
    })
    .eq('id', boatId)

  if (error) return { error: error.message }

  revalidatePath(`/boats/${boatId}`)
  revalidatePath('/boats')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteBoat(boatId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('boats')
    .delete()
    .eq('id', boatId)

  if (error) return { error: error.message }

  revalidatePath('/boats')
  revalidatePath('/', 'layout')
  return { success: true }
}
