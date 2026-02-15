'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, PlusCircle, Users, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  boats: { id: string; name: string }[]
}

export function MobileNav({ boats }: MobileNavProps) {
  const pathname = usePathname()

  // Derive currentBoatId from URL, fall back to first boat
  const boatMatch = pathname.match(/^\/boats\/([^/]+)/)
  const currentBoatId = boatMatch ? boatMatch[1] : boats[0]?.id

  const tabs = [
    {
      label: 'Home',
      icon: Home,
      href: currentBoatId ? `/boats/${currentBoatId}` : '/boats',
    },
    {
      label: 'Events',
      icon: Calendar,
      href: currentBoatId ? `/boats/${currentBoatId}/events` : '/boats',
    },
    {
      label: 'Add',
      icon: PlusCircle,
      href: '/boats/new',
      isCenter: true,
    },
    {
      label: 'Crew',
      icon: Users,
      href: currentBoatId ? `/boats/${currentBoatId}/crew` : '/boats',
    },
    {
      label: 'More',
      icon: Menu,
      href: '/notifications',
    },
  ]

  function isActive(href: string) {
    if (href === '/boats') return pathname === '/boats'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-around h-16 px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors',
                tab.isCenter
                  ? 'relative -mt-3'
                  : active
                    ? 'text-primary'
                    : 'text-muted-foreground'
              )}
            >
              {tab.isCenter ? (
                <div className="flex items-center justify-center size-11 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                  <tab.icon className="size-5" />
                </div>
              ) : (
                <tab.icon className="size-5" />
              )}
              <span
                className={cn(
                  'text-[10px] font-medium',
                  tab.isCenter && 'text-muted-foreground mt-0.5'
                )}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
