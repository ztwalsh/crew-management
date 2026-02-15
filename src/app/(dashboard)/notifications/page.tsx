import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import type { Notification } from '@/types'
import { NotificationList } from './notification-list'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <NotificationList
        initialNotifications={(notifications ?? []) as Notification[]}
        userId={user.id}
      />
    </div>
  )
}
