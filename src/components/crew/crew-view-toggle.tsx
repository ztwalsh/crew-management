'use client'

import { useState, useEffect } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CrewTable } from '@/components/crew/crew-table'
import { CrewMemberCard } from '@/components/crew/crew-member-card'
import type { CrewMemberWithProfile, CrewRole } from '@/types'

type ViewMode = 'table' | 'cards'

const STORAGE_KEY = 'crew-view-preference'

interface CrewViewToggleProps {
  members: CrewMemberWithProfile[]
  currentUserRole: CrewRole
  boatId: string
  currentUserId: string
}

export function CrewViewToggle({
  members,
  currentUserRole,
  boatId,
  currentUserId,
}: CrewViewToggleProps) {
  const [view, setView] = useState<ViewMode>('table')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ViewMode | null
    if (stored === 'table' || stored === 'cards') {
      setView(stored)
    }
    setMounted(true)
  }, [])

  function toggleView(newView: ViewMode) {
    setView(newView)
    localStorage.setItem(STORAGE_KEY, newView)
  }

  // Avoid hydration mismatch — render nothing until client is ready
  if (!mounted) return null

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex items-center rounded-lg border border-border/50 bg-[#22252F] p-0.5">
          <Button
            variant={view === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2"
            onClick={() => toggleView('table')}
          >
            <List className="size-4" />
            <span className="sr-only">Table view</span>
          </Button>
          <Button
            variant={view === 'cards' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2"
            onClick={() => toggleView('cards')}
          >
            <LayoutGrid className="size-4" />
            <span className="sr-only">Card view</span>
          </Button>
        </div>
      </div>

      {view === 'table' ? (
        <CrewTable
          members={members}
          currentUserRole={currentUserRole}
          boatId={boatId}
          currentUserId={currentUserId}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <CrewMemberCard
              key={member.id}
              member={member}
              currentUserRole={currentUserRole}
              boatId={boatId}
              isCurrentUser={member.user_id === currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
