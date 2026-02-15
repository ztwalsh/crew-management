import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import {
  Ship,
  Users,
  Calendar,
  MapPin,
  Hash,
  Sailboat,
  UserPlus,
  CalendarPlus,
  Settings,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import type { CrewRole } from '@/types'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatEventDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const eventTypeBadge: Record<string, 'default' | 'secondary' | 'outline'> = {
  race: 'default',
  practice: 'secondary',
  social: 'outline',
  maintenance: 'outline',
  other: 'outline',
}

export default async function BoatDashboardPage({
  params,
}: {
  params: Promise<{ boatId: string }>
}) {
  const { boatId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch boat
  const { data: boat, error: boatError } = await supabase
    .from('boats')
    .select('*')
    .eq('id', boatId)
    .single()

  if (boatError || !boat) notFound()

  // Fetch user's membership to verify access and get role
  const { data: membership } = await supabase
    .from('crew_memberships')
    .select('role')
    .eq('boat_id', boatId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) notFound()

  const userRole = membership.role as CrewRole

  // Fetch crew members with profiles
  const { data: crewMembers } = await supabase
    .from('crew_memberships')
    .select('id, role, sailing_position, profiles(id, full_name, avatar_url)')
    .eq('boat_id', boatId)
    .eq('is_active', true)
    .order('joined_at', { ascending: true })
    .limit(6)

  // Fetch upcoming events
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('*')
    .eq('boat_id', boatId)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(3)

  // Count totals
  const { count: crewCount } = await supabase
    .from('crew_memberships')
    .select('*', { count: 'exact', head: true })
    .eq('boat_id', boatId)
    .eq('is_active', true)

  const { count: upcomingEventCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('boat_id', boatId)
    .gte('start_time', new Date().toISOString())

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin'

  return (
    <div className="space-y-6">
      {/* Boat header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#0EA5E9]/10 text-[#0EA5E9]">
            <Ship className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{boat.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              {boat.boat_type && (
                <span className="flex items-center gap-1">
                  <Sailboat className="size-3.5" />
                  {boat.boat_type}
                </span>
              )}
              {boat.sail_number && (
                <span className="flex items-center gap-1">
                  <Hash className="size-3.5" />
                  {boat.sail_number}
                </span>
              )}
              {boat.home_port && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {boat.home_port}
                </span>
              )}
            </div>
          </div>
        </div>
        {isOwnerOrAdmin && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/boats/${boatId}/settings`}>
              <Settings className="size-4" />
              Settings
            </Link>
          </Button>
        )}
      </div>

      {boat.description && (
        <p className="text-sm text-muted-foreground max-w-2xl">
          {boat.description}
        </p>
      )}

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-[#22252F] border-border/50">
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#0EA5E9]/10">
                <Users className="size-5 text-[#0EA5E9]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{crewCount ?? 0}</p>
                <p className="text-sm text-muted-foreground">Crew members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#22252F] border-border/50">
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#0EA5E9]/10">
                <Calendar className="size-5 text-[#0EA5E9]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingEventCount ?? 0}</p>
                <p className="text-sm text-muted-foreground">Upcoming events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#22252F] border-border/50 sm:col-span-2 lg:col-span-1">
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#0EA5E9]/10">
                <Badge variant="outline" className="text-[#0EA5E9] border-[#0EA5E9]/30 capitalize">
                  {userRole}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Your role</p>
                <p className="text-sm text-muted-foreground capitalize">{userRole}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming events */}
        <Card className="bg-[#22252F] border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Upcoming Events</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/boats/${boatId}/events`}>
                  View all
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 rounded-lg border border-border/40 bg-[#1A1D27] p-3"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#0EA5E9]/10">
                      <Calendar className="size-4 text-[#0EA5E9]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <Badge variant={eventTypeBadge[event.event_type] ?? 'outline'} className="text-[10px] capitalize">
                          {event.event_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatEventDate(event.start_time)}
                      </p>
                      {event.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="size-3" />
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No upcoming events scheduled
              </p>
            )}
            {isOwnerOrAdmin && (
              <>
                <Separator className="my-4" />
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/boats/${boatId}/events`}>
                    <CalendarPlus className="size-4" />
                    Create Event
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Crew members */}
        <Card className="bg-[#22252F] border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Crew Members</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/boats/${boatId}/crew`}>
                  View all
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {crewMembers && crewMembers.length > 0 ? (
              <div className="space-y-2">
                {crewMembers.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg border border-border/40 bg-[#1A1D27] p-3"
                  >
                    <Avatar size="sm">
                      {member.profiles?.avatar_url && (
                        <AvatarImage
                          src={member.profiles.avatar_url}
                          alt={member.profiles.full_name}
                        />
                      )}
                      <AvatarFallback>
                        {getInitials(member.profiles?.full_name ?? '??')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.profiles?.full_name ?? 'Unknown'}
                      </p>
                      {member.sailing_position && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {member.sailing_position}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No crew members yet
              </p>
            )}
            {isOwnerOrAdmin && (
              <>
                <Separator className="my-4" />
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/boats/${boatId}/crew`}>
                    <UserPlus className="size-4" />
                    Invite Crew
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
