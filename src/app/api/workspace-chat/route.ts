import { streamText, convertToModelMessages } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { createClient } from '@/utils/supabase/server'
import { buildWorkspaceSystemPrompt } from '@/lib/ai/workspace-system-prompt'
import { createTools } from '@/lib/ai/tools'

export async function POST(req: Request) {
  const { messages, workspaceId } = await req.json()

  if (!workspaceId) {
    return new Response('Missing workspaceId', { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Verify membership and get role
  const { data: membership } = await supabase
    .from('crew_memberships')
    .select('role')
    .eq('boat_id', workspaceId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) {
    return new Response('Not a member of this workspace', { status: 403 })
  }

  // Get context for the system prompt
  const [{ data: boat }, { data: profile }, { count: crewCount }, { count: eventCount }] = await Promise.all([
    supabase.from('boats').select('name').eq('id', workspaceId).single(),
    supabase.from('profiles').select('full_name, display_name').eq('id', user.id).single(),
    supabase.from('crew_memberships').select('*', { count: 'exact', head: true }).eq('boat_id', workspaceId).eq('is_active', true),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('boat_id', workspaceId).gte('start_time', new Date().toISOString()),
  ])

  const userName = profile?.display_name || profile?.full_name || 'there'

  const systemPrompt = buildWorkspaceSystemPrompt({
    boatId: workspaceId,
    boatName: boat?.name || 'Unknown',
    userRole: membership.role,
    userName: userName.split(' ')[0],
    crewCount: crewCount ?? 0,
    upcomingEventCount: eventCount ?? 0,
  })

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: createTools(workspaceId),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[workspace-chat] Error:', error)
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 })
  }
}
