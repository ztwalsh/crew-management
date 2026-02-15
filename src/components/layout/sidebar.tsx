'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell,
  Plus,
  LogOut,
  Settings,
  Users,
  Calendar,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeft,
  Ship,
  Anchor,
  User,
  Check,
  ChevronsUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CreateBoatDialog } from '@/components/boats/create-boat-dialog'
import type { Profile } from '@/types'

interface SidebarBoat {
  id: string
  name: string
  boat_type: string | null
  photo_url: string | null
  role: string
}

interface SidebarProps {
  profile: Profile
  boats: SidebarBoat[]
}

export function Sidebar({ profile, boats }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Derive currentBoatId from URL
  const boatMatch = pathname.match(/^\/boats\/([^/]+)/)
  const currentBoatId = boatMatch ? boatMatch[1] : null
  const currentBoat = boats.find((b) => b.id === currentBoatId)

  // Derive the current sub-page from the URL (e.g., "/events", "/crew")
  const subPageMatch = pathname.match(/^\/boats\/[^/]+(\/[^/]+)/)
  const currentSubPage = subPageMatch ? subPageMatch[1] : ''

  // Toggle sidebar with `[` key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === '[' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        setCollapsed((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function switchBoat(boatId: string) {
    setSelectorOpen(false)
    router.push(`/boats/${boatId}${currentSubPage}`)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const boatSubLinks = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '' },
    { label: 'Events', icon: Calendar, path: '/events' },
    { label: 'Crew', icon: Users, path: '/crew' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ]

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-full border-r border-border bg-sidebar transition-all duration-200 ease-in-out',
        collapsed ? 'w-[60px]' : 'w-[250px]'
      )}
    >
      {/* Logo / Brand */}
      <div className="flex h-12 items-center justify-between px-3 border-b border-border">
        <Link
          href={currentBoatId ? `/boats/${currentBoatId}` : '/boats'}
          className={cn(
            'flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <Anchor className="size-5 shrink-0 text-primary" />
          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight">Crew</span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>

      {/* Boat Selector */}
      <div className="px-2 pt-2 pb-1">
        {boats.length > 0 ? (
          <Popover open={selectorOpen} onOpenChange={setSelectorOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? (currentBoat?.name ?? 'Select boat') : undefined}
              >
                <Ship className="size-4 shrink-0 text-primary" />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate text-left font-medium text-sidebar-foreground">
                      {currentBoat?.name ?? 'Select a boat'}
                    </span>
                    <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0" />
                  </>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              side={collapsed ? 'right' : 'bottom'}
              align="start"
              className="w-56 p-1"
            >
              <div className="space-y-0.5">
                {boats.map((boat) => (
                  <button
                    key={boat.id}
                    onClick={() => switchBoat(boat.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                      boat.id === currentBoatId
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    )}
                  >
                    <Ship className="size-4 shrink-0" />
                    <span className="flex-1 truncate text-left">{boat.name}</span>
                    {boat.id === currentBoatId && (
                      <Check className="size-3.5 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <Separator className="my-1" />
              <CreateBoatDialog
                trigger={
                  <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors">
                    <Plus className="size-4 shrink-0" />
                    <span>Create a boat</span>
                  </button>
                }
              />
            </PopoverContent>
          </Popover>
        ) : (
          <CreateBoatDialog
            trigger={
              <button
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent transition-colors',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? 'Create a boat' : undefined}
              >
                <Plus className="size-4 shrink-0 text-primary" />
                {!collapsed && <span>Create a boat</span>}
              </button>
            }
          />
        )}
      </div>

      <div className="px-3 py-1">
        <Separator />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Boat nav links */}
        {currentBoatId && (
          <nav className="space-y-0.5 px-2">
            {boatSubLinks.map((sub) => {
              const href = `/boats/${currentBoatId}${sub.path}`
              const subActive =
                sub.path === ''
                  ? pathname === `/boats/${currentBoatId}`
                  : isActive(href)
              return (
                <SidebarLink
                  key={sub.path}
                  href={href}
                  icon={sub.icon}
                  label={sub.label}
                  active={subActive}
                  collapsed={collapsed}
                />
              )
            })}
          </nav>
        )}

        {currentBoatId && (
          <div className="px-3 py-2">
            <Separator />
          </div>
        )}

        <nav className="space-y-0.5 px-2">
          <SidebarLink
            href="/notifications"
            icon={Bell}
            label="Notifications"
            active={isActive('/notifications')}
            collapsed={collapsed}
          />
        </nav>
      </div>

      {/* Bottom user section */}
      <div className="border-t border-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex w-full items-center gap-2 rounded-md p-1.5 text-sm transition-colors hover:bg-sidebar-accent',
                collapsed && 'justify-center'
              )}
            >
              <Avatar size="sm">
                {profile.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                )}
                <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {profile.display_name || profile.full_name}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={collapsed ? 'right' : 'top'}
            align="start"
            className="w-56"
          >
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2">
                <User className="size-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}

/* --------------------------------------------------------- */
/* Internal sidebar link component                           */
/* --------------------------------------------------------- */
function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  collapsed,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
  collapsed: boolean
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        collapsed && 'justify-center',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}
