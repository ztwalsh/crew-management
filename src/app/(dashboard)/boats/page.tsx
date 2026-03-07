import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

export default async function BoatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

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

  return (
    <div className="py-8">
      <OnboardingWizard />
    </div>
  )
}
