'use client'

import { CrewTable } from '@/components/crew-components/CrewTable'
import { CrewMemberCard } from '@/components/crew-components/CrewMemberCard'
import { RaceCard } from '@/components/crew-components/RaceCard'
import { RaceRoster } from '@/components/crew-components/RaceRoster'
import { ConfirmationBubble } from '@/components/crew-components/ConfirmationBubble'
import { CrewImportPreview } from '@/components/crew-components/CrewImportPreview'
import { MessageComposer } from '@/components/crew-components/MessageComposer'
import { ThreadStarter } from '@/components/crew-components/ThreadStarter'
import { Pin } from 'lucide-react'
import type { SerializedFilters } from '@/components/crew-components/CrewTable'

interface ComponentRendererProps {
  toolName: string
  toolResult: unknown
  componentHint?: string
  workspaceId: string
  pinnedViews?: { id: string; component_type: string }[]
  onPin: (view: {
    label: string
    component_type: string
    query_params: Record<string, unknown>
    folder: string | null
  }) => void
  onUnpin?: (viewId: string) => void
}

function buildFilterLabel(base: string, filters: SerializedFilters, search: string): string {
  const parts: string[] = []
  for (const [, values] of Object.entries(filters)) {
    if (values.length > 0 && values.length <= 3) {
      parts.push(values.join(', '))
    } else if (values.length > 3) {
      parts.push(`${values.slice(0, 2).join(', ')} +${values.length - 2}`)
    }
  }
  if (search) parts.push(`"${search}"`)
  if (parts.length === 0) return base
  return `${base} — ${parts.join(' · ')}`
}

// Maps tool names to component types
function resolveComponentType(toolName: string, componentHint?: string): string | null {
  // Explicit hint takes priority
  if (componentHint) return componentHint

  const mapping: Record<string, string> = {
    list_crew: 'crew_table',
    list_events: 'race_card',
    get_event_availability: 'race_roster',
    create_event: 'race_card',
    create_recurring_events: 'confirmation',
    invite_crew: 'confirmation',
    update_rsvp: 'confirmation',
    delete_event: 'confirmation',
    import_crew_csv: 'import_preview',
    import_events_csv: 'import_preview',
  }

  return mapping[toolName] || 'confirmation'
}

export function ComponentRenderer({
  toolName,
  toolResult,
  componentHint,
  workspaceId,
  pinnedViews,
  onPin,
  onUnpin,
}: ComponentRendererProps) {
  const result = toolResult as Record<string, unknown>

  // Don't render if there's an error
  if (result?.error) {
    return null
  }

  const componentType = resolveComponentType(toolName, componentHint)
  if (!componentType) return null

  function handlePin(label: string) {
    onPin({
      label,
      component_type: componentType!,
      query_params: { toolName, workspaceId },
      folder: null,
    })
  }

  const pinButton = (label: string) => (
    <button
      onClick={() => handlePin(label)}
      className="
        pin-button opacity-0 group-hover:opacity-100
        absolute top-3 right-3
        size-7 rounded-lg flex items-center justify-center
        bg-white/[0.06] hover:bg-white/[0.12]
        border border-white/[0.08]
        text-white/40 hover:text-white/70
        transition-all duration-200
      "
      title="Pin to sidebar"
    >
      <Pin className="size-3.5" />
    </button>
  )

  return (
    <div className="group relative">
      {componentType === 'crew_table' && (
        <CrewTable
          data={result}
          onPin={(filterState) => {
            const label = buildFilterLabel('Crew Roster', filterState.activeFilters, filterState.search)
            onPin({
              label,
              component_type: 'crew_table',
              query_params: {
                toolName,
                workspaceId,
                data: result,
                filters: filterState.activeFilters,
                search: filterState.search,
              },
              folder: null,
            })
          }}
        />
      )}

      {componentType === 'crew_card' && (
        <>
          {pinButton('Crew Member')}
          <CrewMemberCard data={result} />
        </>
      )}

      {componentType === 'race_card' && (
        <>
          {pinButton(
            toolName === 'list_events' ? 'Events' : 'Event'
          )}
          <RaceCard data={result} toolName={toolName} />
        </>
      )}

      {componentType === 'race_roster' && (
        <>
          {pinButton('Race Roster')}
          <RaceRoster data={result} />
        </>
      )}

      {componentType === 'confirmation' && (
        <ConfirmationBubble data={result} toolName={toolName} />
      )}

      {componentType === 'import_preview' && (
        <>
          {pinButton('Import')}
          <CrewImportPreview data={result} />
        </>
      )}

      {componentType === 'message_composer' && (
        <MessageComposer data={result} workspaceId={workspaceId} />
      )}

      {componentType === 'thread_starter' && (
        <ThreadStarter data={result} workspaceId={workspaceId} />
      )}
    </div>
  )
}
