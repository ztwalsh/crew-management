import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ChatInterface } from '@/components/chat/ChatInterface'

export default async function WorkspaceChatPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch workspace context in parallel
  const [
    { data: membership },
    { data: boat },
    { data: profile },
    { data: pinnedViews },
    { count: crewCount },
  ] = await Promise.all([
    supabase
      .from('crew_memberships')
      .select('role')
      .eq('boat_id', workspaceId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single(),
    supabase
      .from('boats')
      .select('id, name, boat_type')
      .eq('id', workspaceId)
      .single(),
    supabase
      .from('profiles')
      .select('id, full_name, display_name, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('pinned_views')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('crew_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('boat_id', workspaceId)
      .eq('is_active', true),
  ])

  if (!membership || !boat) redirect('/boats')

  const userName = profile?.display_name || profile?.full_name || 'there'
  const firstName = userName.split(' ')[0]

  return (
    <ChatInterface
      workspaceId={workspaceId}
      workspaceName={boat.name}
      userName={firstName}
      userRole={membership.role}
      userId={user.id}
      pinnedViews={pinnedViews ?? []}
      crewCount={crewCount ?? 0}
    />
  )
}
