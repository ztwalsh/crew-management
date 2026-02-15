import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Users, Mail, Clock, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CrewMemberCard } from '@/components/crew/crew-member-card'
import { InviteCrewDialog } from '@/components/crew/invite-crew-dialog'
import { RevokeInvitationButton } from '@/components/crew/revoke-invitation-button'
import type { CrewRole, CrewMemberWithProfile } from '@/types'
import { formatDistanceToNow } from 'date-fns'

export default async function CrewPage({
  params,
}: {
  params: Promise<{ boatId: string }>
}) {
  const { boatId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch boat data
  const { data: boat, error: boatError } = await supabase
    .from('boats')
    .select('id, name')
    .eq('id', boatId)
    .single()

  if (boatError || !boat) notFound()

  // Verify the user is a member and get their role
  const { data: membership } = await supabase
    .from('crew_memberships')
    .select('role')
    .eq('boat_id', boatId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) notFound()

  const userRole = membership.role as CrewRole
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin'

  // Fetch all active crew members with their profiles
  const { data: crewMembers } = await supabase
    .from('crew_memberships')
    .select('*, profiles(*)')
    .eq('boat_id', boatId)
    .eq('is_active', true)
    .order('role', { ascending: true })
    .order('joined_at', { ascending: true })

  // Fetch pending invitations (only for owner/admin)
  let pendingInvitations: any[] = []
  if (isOwnerOrAdmin) {
    const { data: invitations } = await supabase
      .from('invitations')
      .select('*, profiles:invited_by(full_name)')
      .eq('boat_id', boatId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    pendingInvitations = invitations ?? []
  }

  // Sort crew: owner first, then admins, then crew
  const roleOrder: Record<string, number> = { owner: 0, admin: 1, crew: 2 }
  const sortedCrew = (crewMembers ?? []).sort(
    (a, b) => (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3)
  ) as CrewMemberWithProfile[]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#0EA5E9]/10">
            <Users className="size-5 text-[#0EA5E9]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Crew</h1>
            <p className="text-sm text-muted-foreground">
              {sortedCrew.length} member{sortedCrew.length !== 1 ? 's' : ''} on {boat.name}
            </p>
          </div>
        </div>
        {isOwnerOrAdmin && (
          <InviteCrewDialog boatId={boatId} />
        )}
      </div>

      {/* Active crew members grid */}
      {sortedCrew.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCrew.map((member) => (
            <CrewMemberCard
              key={member.id}
              member={member}
              currentUserRole={userRole}
              boatId={boatId}
              isCurrentUser={member.user_id === user.id}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-[#22252F] border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex size-12 items-center justify-center rounded-full bg-[#1A1D27] mb-3">
              <Users className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No crew members yet</p>
            {isOwnerOrAdmin && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                Invite people to get started
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pending invitations section (owner/admin only) */}
      {isOwnerOrAdmin && pendingInvitations.length > 0 && (
        <>
          <Separator />
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Mail className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">
                Pending Invitations ({pendingInvitations.length})
              </h2>
            </div>
            <div className="space-y-2">
              {pendingInvitations.map((invitation) => (
                <Card
                  key={invitation.id}
                  className="bg-[#22252F] border-border/50"
                >
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1A1D27]">
                          <Mail className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {invitation.invited_email}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] capitalize"
                            >
                              {invitation.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="size-3" />
                              {formatDistanceToNow(new Date(invitation.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                            {invitation.profiles?.full_name && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <ShieldCheck className="size-3" />
                                by {invitation.profiles.full_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <RevokeInvitationButton invitationId={invitation.id} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
