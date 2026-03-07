import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verify membership
  const { data: membership } = await supabase
    .from('crew_memberships')
    .select('role, boats(id, name)')
    .eq('boat_id', workspaceId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) redirect('/boats')

  return (
    <div className="workspace-shell h-screen overflow-hidden">
      {children}
    </div>
  )
}
