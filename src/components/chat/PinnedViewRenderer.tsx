'use client'

import { ArrowLeft } from 'lucide-react'
import { CrewTable } from '@/components/crew-components/CrewTable'
import type { SerializedFilters } from '@/components/crew-components/CrewTable'

interface PinnedView {
  id: string
  label: string
  component_type: string
  query_params: Record<string, unknown>
  folder: string | null
  created_at: string
}

interface PinnedViewRendererProps {
  view: PinnedView
  onBack: () => void
  onPin: (view: {
    label: string
    component_type: string
    query_params: Record<string, unknown>
    folder: string | null
  }) => void
}

export function PinnedViewRenderer({ view, onBack, onPin }: PinnedViewRendererProps) {
  const { query_params } = view

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-white/[0.06] shrink-0">
        <button
          onClick={onBack}
          className="size-8 rounded-lg flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/50 hover:text-white/80 transition-all"
        >
          <ArrowLeft className="size-4" />
        </button>
        <span className="text-sm font-medium text-[#e8e9ed] truncate">
          {view.label}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {view.component_type === 'crew_table' && !!query_params.data && (
            <CrewTable
              key={view.id}
              data={query_params.data as Record<string, unknown>}
              initialFilters={query_params.filters as SerializedFilters | undefined}
              initialSearch={(query_params.search as string) || ''}
              onPin={(filterState) => {
                const parts: string[] = []
                for (const [, values] of Object.entries(filterState.activeFilters)) {
                  if (values.length > 0 && values.length <= 3) {
                    parts.push(values.join(', '))
                  } else if (values.length > 3) {
                    parts.push(`${values.slice(0, 2).join(', ')} +${values.length - 2}`)
                  }
                }
                if (filterState.search) parts.push(`"${filterState.search}"`)
                const label = parts.length > 0
                  ? `Crew Roster — ${parts.join(' · ')}`
                  : 'Crew Roster'

                onPin({
                  label,
                  component_type: 'crew_table',
                  query_params: {
                    toolName: query_params.toolName,
                    workspaceId: query_params.workspaceId,
                    data: query_params.data,
                    filters: filterState.activeFilters,
                    search: filterState.search,
                  },
                  folder: null,
                })
              }}
            />
          )}

          {/* Fallback for unsupported pinned view types */}
          {!(view.component_type === 'crew_table' && query_params.data) && (
            <div className="text-center py-12">
              <p className="text-sm text-white/30">
                This view can&apos;t be displayed yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
