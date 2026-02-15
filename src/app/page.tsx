import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: memberships } = await supabase
    .from('crew_memberships')
    .select('boats(id)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('joined_at', { ascending: false })
    .limit(1)

  const firstBoatId = (memberships?.[0] as any)?.boats?.id

  if (firstBoatId) {
    redirect(`/boats/${firstBoatId}`)
  }

  redirect('/boats')
}
