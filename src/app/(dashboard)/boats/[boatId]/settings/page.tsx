import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Ship, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { EditBoatForm } from '@/components/boats/edit-boat-form'
import { DeleteBoatDialog } from '@/components/boats/delete-boat-dialog'
import type { CrewRole } from '@/types'

export default async function BoatSettingsPage({
  params,
}: {
  params: Promise<{ boatId: string }>
}) {
  const { boatId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch boat
  const { data: boat, error: boatError } = await supabase
    .from('boats')
    .select('*')
    .eq('id', boatId)
    .single()

  if (boatError || !boat) notFound()

  // Verify user is owner or admin
  const { data: membership } = await supabase
    .from('crew_memberships')
    .select('role')
    .eq('boat_id', boatId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    notFound()
  }

  const userRole = membership.role as CrewRole
  const isOwner = userRole === 'owner'

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={`/boats/${boatId}`} className="hover:text-foreground transition-colors">
          {boat.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Settings</span>
      </nav>

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#0EA5E9]/10 text-[#0EA5E9]">
          <Ship className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Boat Settings</h1>
          <p className="text-sm text-muted-foreground">
            Update your boat details and manage settings
          </p>
        </div>
      </div>

      <Separator />

      {/* Edit boat form */}
      <EditBoatForm boat={boat} />

      {/* Danger zone - owner only */}
      {isOwner && (
        <>
          <Separator />
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
            <h2 className="text-lg font-semibold text-destructive mb-1">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete this boat and all associated data including crew memberships,
              events, and assignments. This action cannot be undone.
            </p>
            <DeleteBoatDialog boatId={boat.id} boatName={boat.name} />
          </div>
        </>
      )}
    </div>
  )
}
