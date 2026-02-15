import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Ship } from 'lucide-react'
import { CreateBoatDialog } from '@/components/boats/create-boat-dialog'

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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-[#1A1D27] py-16 px-6">
      <div className="flex size-14 items-center justify-center rounded-full bg-[#0EA5E9]/10 mb-4">
        <Ship className="size-7 text-[#0EA5E9]" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No boats yet</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
        Create your first boat to start managing your crew, scheduling events,
        and tracking availability.
      </p>
      <CreateBoatDialog />
    </div>
  )
}
