import { streamText, convertToModelMessages } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { createClient } from '@/utils/supabase/server'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { createTools } from '@/lib/ai/tools'

export async function POST(req: Request) {
  const { messages, boatId } = await req.json()

  if (!boatId) {
    return new Response('Missing boatId', { status: 400 })
  }

  // Authenticate and get context
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Verify membership and get role
  const { data: membership } = await supabase
    .from('crew_memberships')
    .select('role')
    .eq('boat_id', boatId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) {
    return new Response('Not a member of this boat', { status: 403 })
  }

  // Get context for the system prompt
  const [{ data: boat }, { data: profile }, { count: crewCount }, { count: eventCount }] = await Promise.all([
    supabase.from('boats').select('name').eq('id', boatId).single(),
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('crew_memberships').select('*', { count: 'exact', head: true }).eq('boat_id', boatId).eq('is_active', true),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('boat_id', boatId).gte('start_time', new Date().toISOString()),
  ])

  const systemPrompt = buildSystemPrompt({
    boatId,
    boatName: boat?.name || 'Unknown',
    userRole: membership.role,
    userName: profile?.full_name || 'Unknown',
    crewCount: crewCount ?? 0,
    upcomingEventCount: eventCount ?? 0,
  })

  const result = streamText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: createTools(boatId),
  })

  return result.toUIMessageStreamResponse()
}
