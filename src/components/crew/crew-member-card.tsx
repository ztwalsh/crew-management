'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Anchor,
  UserMinus,
  Loader2,
} from 'lucide-react'
import { updateCrewMember, removeCrewMember } from '@/actions/crew'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CrewMemberWithProfile, CrewRole, SailingPosition } from '@/types'

interface CrewMemberCardProps {
  member: CrewMemberWithProfile
  currentUserRole: CrewRole
  boatId: string
  isCurrentUser: boolean
}

const roleBadgeVariant: Record<CrewRole, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'secondary',
  crew: 'outline',
}

const roleLabel: Record<CrewRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  crew: 'Crew',
}

const sailingPositions: { value: SailingPosition; label: string }[] = [
  { value: 'skipper', label: 'Skipper' },
  { value: 'helmsman', label: 'Helmsman' },
  { value: 'tactician', label: 'Tactician' },
  { value: 'trimmer', label: 'Trimmer' },
  { value: 'bowman', label: 'Bowman' },
  { value: 'pit', label: 'Pit' },
  { value: 'grinder', label: 'Grinder' },
  { value: 'navigator', label: 'Navigator' },
  { value: 'crew', label: 'Crew' },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function CrewMemberCard({
  member,
  currentUserRole,
  boatId,
  isCurrentUser,
}: CrewMemberCardProps) {
  const [isPending, startTransition] = useTransition()
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const profile = member.profiles
  const isOwnerOrAdmin = currentUserRole === 'owner' || currentUserRole === 'admin'
  const canManage = isOwnerOrAdmin && !isCurrentUser && member.role !== 'owner'
  const canChangeRole =
    currentUserRole === 'owner' && member.role !== 'owner' && !isCurrentUser

  function handleRoleChange(newRole: 'admin' | 'crew') {
    startTransition(async () => {
      const result = await updateCrewMember(member.id, { role: newRole })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Role updated to ${roleLabel[newRole]}`)
      }
    })
  }

  function handlePositionChange(newPosition: SailingPosition | null) {
    startTransition(async () => {
      const result = await updateCrewMember(member.id, {
        sailing_position: newPosition,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          newPosition
            ? `Position updated to ${newPosition}`
            : 'Position cleared'
        )
      }
    })
  }

  async function handleRemove() {
    setIsRemoving(true)
    try {
      const result = await removeCrewMember(member.id, boatId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${profile.full_name} has been removed from the crew`)
        setShowRemoveDialog(false)
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <>
      <Card className="bg-[#22252F] border-border/50 transition-all duration-200 hover:border-border/80">
        <CardContent className="pt-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar size="lg">
                {profile.avatar_url && (
                  <AvatarImage
                    src={profile.avatar_url}
                    alt={profile.full_name}
                  />
                )}
                <AvatarFallback>
                  {getInitials(profile.full_name || '??')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {profile.full_name}
                  </p>
                  {isCurrentUser && (
                    <span className="text-[10px] text-muted-foreground">(you)</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {profile.email}
                </p>
              </div>
            </div>

            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0 shrink-0"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="size-4" />
                    )}
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Manage Member</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {canChangeRole && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <ShieldCheck className="size-4" />
                        Change role
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={() => handleRoleChange('admin')}
                          disabled={member.role === 'admin'}
                        >
                          <Shield className="size-4" />
                          Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRoleChange('crew')}
                          disabled={member.role === 'crew'}
                        >
                          <Anchor className="size-4" />
                          Crew
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Anchor className="size-4" />
                      Sailing position
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {sailingPositions.map((pos) => (
                        <DropdownMenuItem
                          key={pos.value}
                          onClick={() => handlePositionChange(pos.value)}
                          disabled={member.sailing_position === pos.value}
                        >
                          {pos.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handlePositionChange(null)}
                        disabled={!member.sailing_position}
                      >
                        Clear position
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowRemoveDialog(true)}
                  >
                    <UserMinus className="size-4" />
                    Remove from crew
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Role and position badges */}
          <div className="flex items-center gap-2 mt-3">
            <Badge variant={roleBadgeVariant[member.role]}>
              {roleLabel[member.role]}
            </Badge>
            {member.sailing_position && (
              <Badge variant="outline" className="capitalize">
                {member.sailing_position}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Remove confirmation dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {profile.full_name}?</DialogTitle>
            <DialogDescription>
              This will remove {profile.full_name} from the crew. They will lose
              access to this boat and all associated events. You can re-invite
              them later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isRemoving}
            >
              {isRemoving && <Loader2 className="size-4 animate-spin" />}
              {isRemoving ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
