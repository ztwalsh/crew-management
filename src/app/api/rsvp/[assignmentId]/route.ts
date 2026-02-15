import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyRsvpToken } from '@/lib/rsvp-token'

// Use service role client since this is unauthenticated
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const { assignmentId } = await params
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const token = searchParams.get('token')

  if (!status || !token) {
    return NextResponse.redirect(new URL('/rsvp/confirmed?error=invalid', request.url))
  }

  if (!['accepted', 'declined', 'tentative'].includes(status)) {
    return NextResponse.redirect(new URL('/rsvp/confirmed?error=invalid', request.url))
  }

  // Verify HMAC token
  if (!verifyRsvpToken(assignmentId, status, token)) {
    return NextResponse.redirect(new URL('/rsvp/confirmed?error=invalid', request.url))
  }

  const supabase = getServiceClient()

  // Update the assignment
  const { data, error } = await supabase
    .from('event_assignments')
    .update({
      rsvp_status: status,
      responded_at: new Date().toISOString(),
    })
    .eq('id', assignmentId)
    .select('rsvp_status, events(title, start_time, boats(name))')
    .single()

  if (error) {
    return NextResponse.redirect(new URL('/rsvp/confirmed?error=failed', request.url))
  }

  const eventTitle = (data as any)?.events?.title || 'the event'
  const boatName = (data as any)?.events?.boats?.name || ''

  const redirectUrl = new URL('/rsvp/confirmed', request.url)
  redirectUrl.searchParams.set('status', status)
  redirectUrl.searchParams.set('event', eventTitle)
  if (boatName) redirectUrl.searchParams.set('boat', boatName)

  return NextResponse.redirect(redirectUrl)
}
