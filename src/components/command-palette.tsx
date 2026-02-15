'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Ship, Plus, Calendar, Home } from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'

interface BoatItem {
  id: string
  name: string
  boat_type: string | null
  photo_url: string | null
  role: string
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boats: BoatItem[]
}

export function CommandPalette({ open, onOpenChange, boats }: CommandPaletteProps) {
  const router = useRouter()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
    },
    [open, onOpenChange]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  function runCommand(command: () => void) {
    onOpenChange(false)
    command()
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command Palette"
      description="Search for boats, actions, and more..."
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Navigation group */}
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/boats'))}
          >
            <Home className="size-4" />
            <span>Home</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Boats group */}
        {boats.length > 0 && (
          <>
            <CommandGroup heading="Boats">
              {boats.map((boat) => (
                <CommandItem
                  key={boat.id}
                  value={boat.name}
                  onSelect={() =>
                    runCommand(() => router.push(`/boats/${boat.id}`))
                  }
                >
                  <Ship className="size-4" />
                  <span>{boat.name}</span>
                  {boat.boat_type && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {boat.boat_type}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Actions group */}
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/boats/new'))}
          >
            <Plus className="size-4" />
            <span>Create Boat</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              const firstBoat = boats[0]
              if (firstBoat) {
                runCommand(() =>
                  router.push(`/boats/${firstBoat.id}/events/new`)
                )
              } else {
                runCommand(() => router.push('/boats'))
              }
            }}
          >
            <Calendar className="size-4" />
            <span>Create Event</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
