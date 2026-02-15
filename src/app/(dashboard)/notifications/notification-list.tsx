'use client'

import { useCallback, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import {
  Bell,
  BellOff,
  CalendarClock,
  CalendarPlus,
  CheckCircle,
  ClipboardCheck,
  ListTodo,
  Mail,
  UserPlus,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Notification, NotificationType } from '@/types'

interface NotificationListProps {
  initialNotifications: Notification[]
  userId: string
}

const typeIcons: Record<
  NotificationType,
  React.ComponentType<{ className?: string }>
> = {
  invitation_received: Mail,
  invitation_accepted: UserPlus,
  event_created: CalendarPlus,
  event_updated: CalendarClock,
  event_reminder: Bell,
  rsvp_received: CheckCircle,
  todo_assigned: ListTodo,
  todo_completed: ClipboardCheck,
}

export function NotificationList({
  initialNotifications,
  userId,
}: NotificationListProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      return (data ?? []) as Notification[]
    },
    initialData: initialNotifications,
  })

  const hasUnread = useMemo(
    () => notifications.some((n) => !n.is_read),
    [notifications]
  )

  const handleMarkAllRead = useCallback(() => {
    startTransition(async () => {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({
        queryKey: ['unread-notifications-count'],
      })
    })
  }, [supabase, userId, queryClient])

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (!notification.is_read) {
        supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notification.id)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            queryClient.invalidateQueries({
              queryKey: ['unread-notifications-count'],
            })
          })
      }

      const data = notification.data as Record<string, any> | null
      if (data?.event_id && data?.boat_id) {
        router.push(`/boats/${data.boat_id}/events/${data.event_id}`)
      } else if (data?.boat_id) {
        router.push(`/boats/${data.boat_id}`)
      }
    },
    [supabase, queryClient, router]
  )

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay up to date with your crew activity
          </p>
        </div>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
          >
            <CheckCircle className="size-3.5 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 px-6">
          <BellOff className="size-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">No notifications yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            When your crew takes action -- new events, RSVPs, invitations -- you
            will see them here.
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {notifications.map((notification, i) => {
            const Icon = typeIcons[notification.type] ?? Bell
            return (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                  !notification.is_read && 'bg-muted/30'
                )}
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
                  <Icon className="size-4 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        'text-sm leading-snug',
                        !notification.is_read
                          ? 'font-medium'
                          : 'text-muted-foreground'
                      )}
                    >
                      {notification.title}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      {!notification.is_read && (
                        <Badge
                          variant="default"
                          className="h-2 w-2 rounded-full p-0 bg-destructive"
                        />
                      )}
                    </div>
                  </div>
                  {notification.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </Card>
      )}
    </>
  )
}
