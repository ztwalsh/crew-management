'use client'

import { useState, useRef, useEffect } from 'react'
import { Anchor, Pin, Settings, X, Compass } from 'lucide-react'
import Link from 'next/link'

interface PinnedView {
  id: string
  label: string
  component_type: string
  query_params: Record<string, unknown>
  folder: string | null
  created_at: string
}

interface PinnedSidebarProps {
  workspaceId: string
  workspaceName: string
  pinnedViews: PinnedView[]
  selectedViewId: string | null
  onSelect: (viewId: string) => void
  onUnpin: (viewId: string) => void
  onRename: (viewId: string, newLabel: string) => void
  onClose: () => void
}

// Component type → accent color
const ACCENT_COLORS: Record<string, string> = {
  crew_table: '#22c55e',
  crew_card: '#22c55e',
  race_card: '#a855f7',
  race_roster: '#f59e0b',
  import_preview: '#3b82f6',
  message_composer: '#ec4899',
  thread_starter: '#ec4899',
  confirmation: '#0ea5e9',
}

function EditableLabel({
  viewId,
  label,
  onRename,
}: {
  viewId: string
  label: string
  onRename: (viewId: string, newLabel: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(label)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function commit() {
    const trimmed = value.trim()
    if (trimmed && trimmed !== label) {
      onRename(viewId, trimmed)
    } else {
      setValue(label)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setValue(label); setEditing(false) }
        }}
        className="text-xs text-white/80 bg-white/[0.06] border border-white/[0.12] rounded px-1.5 py-0.5 w-full focus:outline-none focus:border-[#0ea5e9]/40"
      />
    )
  }

  return (
    <span
      onDoubleClick={() => setEditing(true)}
      className="text-xs text-white/60 group-hover:text-white/80 truncate flex-1 transition-colors select-none"
      title="Double-click to rename"
    >
      {label}
    </span>
  )
}

export function PinnedSidebar({
  workspaceId,
  workspaceName,
  pinnedViews,
  selectedViewId,
  onSelect,
  onUnpin,
  onRename,
  onClose,
}: PinnedSidebarProps) {
  return (
    <div className="w-64 h-full bg-[#080c18] border-r border-white/[0.06] flex flex-col">
      {/* Workspace header */}
      <div className="px-4 h-14 flex items-center gap-2.5 border-b border-white/[0.06] shrink-0">
        <div className="size-7 rounded-lg bg-[#0ea5e9]/15 flex items-center justify-center">
          <Anchor className="size-3.5 text-[#0ea5e9]" />
        </div>
        <span className="text-sm font-semibold text-[#e8e9ed] truncate">
          {workspaceName}
        </span>
      </div>

      {/* Pinned views */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        {pinnedViews.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="compass-ghost mb-4 text-white/[0.06]">
              <Compass className="size-16" strokeWidth={1} />
            </div>
            <p className="text-xs text-white/20 leading-relaxed">
              Nothing pinned yet.<br />
              Build your dashboard.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-white/25">
              Pinned
            </p>
            {pinnedViews.map((view) => {
              const isSelected = view.id === selectedViewId
              return (
                <div
                  key={view.id}
                  onClick={() => onSelect(view.id)}
                  className={`
                    group flex items-center gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors
                    ${isSelected
                      ? 'bg-white/[0.08] border border-white/[0.1]'
                      : 'hover:bg-white/[0.04] border border-transparent'
                    }
                  `}
                >
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: ACCENT_COLORS[view.component_type] || '#0ea5e9' }}
                  />
                  <EditableLabel viewId={view.id} label={view.label} onRename={onRename} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onUnpin(view.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 size-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 transition-all shrink-0"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="shrink-0 border-t border-white/[0.06] p-2">
        <Link
          href={`/boats`}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
        >
          <Settings className="size-3.5" />
          Back to boats
        </Link>
      </div>
    </div>
  )
}
