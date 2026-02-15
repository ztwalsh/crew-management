'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommandPalette } from '@/components/command-palette'
import { NotificationBell } from '@/components/layout/notification-bell'
import type { Profile } from '@/types'

interface BoatItem {
  id: string
  name: string
  boat_type: string | null
  photo_url: string | null
  role: string
}

interface HeaderProps {
  profile: Profile
  boats?: BoatItem[]
}

export function Header({ profile, boats = [] }: HeaderProps) {
  const [commandOpen, setCommandOpen] = useState(false)

  return (
    <>
      <header className="hidden md:flex h-12 items-center justify-between border-b border-border bg-background px-4">
        {/* Left: page title area (populated by individual pages later) */}
        <div className="flex items-center gap-2">
          {/* Placeholder for breadcrumbs or page title */}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCommandOpen(true)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <Search className="size-4" />
            <span className="text-xs">Search</span>
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">&#8984;</span>K
            </kbd>
          </Button>

          <NotificationBell />
        </div>
      </header>

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        boats={boats}
      />
    </>
  )
}
