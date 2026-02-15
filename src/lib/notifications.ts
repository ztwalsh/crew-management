import { createClient } from '@/utils/supabase/server'

interface CreateNotificationParams {
  userId: string
  type:
    | 'invitation_received'
    | 'invitation_accepted'
    | 'event_created'
    | 'event_updated'
    | 'event_reminder'
    | 'rsvp_received'
    | 'todo_assigned'
    | 'todo_completed'
  title: string
  body?: string
  data?: Record<string, any>
}

export async function createNotification({
  userId,
  type,
  title,
  body,
  data = {},
}: CreateNotificationParams) {
  const supabase = await createClient()
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body: body || null,
    data,
  })
}

export async function notifyBoatCrew(
  boatId: string,
  excludeUserId: string,
  notification: Omit<CreateNotificationParams, 'userId'>
) {
  const supabase = await createClient()
  const { data: members } = await supabase
    .from('crew_memberships')
    .select('user_id')
    .eq('boat_id', boatId)
    .eq('is_active', true)
    .neq('user_id', excludeUserId)

  if (!members?.length) return

  await supabase.from('notifications').insert(
    members.map((m) => ({
      user_id: m.user_id,
      type: notification.type,
      title: notification.title,
      body: notification.body || null,
      data: notification.data || {},
    }))
  )
}
