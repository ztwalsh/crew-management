'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Users, ChevronUp, ChevronDown, Pin, Filter, X, Search } from 'lucide-react'

interface CrewMember {
  name: string
  email: string
  role: string
  position: string
  joined: string
}

export type SerializedFilters = Record<string, string[]>

interface CrewTableProps {
  data: Record<string, unknown>
  initialFilters?: SerializedFilters
  initialSearch?: string
  onPin?: (filters: { activeFilters: SerializedFilters; search: string }) => void
}

type SortKey = 'name' | 'role' | 'position'

const ROLE_COLORS: Record<string, string> = {
  owner: '#f59e0b',
  admin: '#a855f7',
  crew: '#0ea5e9',
}

const POSITION_LABELS: Record<string, string> = {
  skipper: 'Skipper',
  helmsman: 'Helm',
  tactician: 'Tactician',
  trimmer: 'Trimmer',
  bowman: 'Bow',
  pit: 'Pit',
  grinder: 'Grinder',
  navigator: 'Nav',
  crew: 'Crew',
  unassigned: '—',
}

// --- Dynamic filter logic ---

// Max unique values for a field to be treated as categorical (multi-select)
const CATEGORICAL_THRESHOLD = 15

interface FieldMeta {
  key: string
  label: string
  type: 'categorical' | 'text'
  values: string[] // unique values for categorical fields
}

// Hidden/uninteresting fields to exclude from filter options
const HIDDEN_FIELDS = new Set(['joined'])

function analyzeFields(rows: Record<string, unknown>[]): FieldMeta[] {
  if (rows.length === 0) return []
  const keys = Object.keys(rows[0]).filter((k) => !HIDDEN_FIELDS.has(k))

  return keys.map((key) => {
    const allValues = rows.map((r) => String(r[key] ?? '')).filter(Boolean)
    const unique = [...new Set(allValues)].sort()
    const isCategorical = unique.length <= CATEGORICAL_THRESHOLD && unique.length > 0
    return {
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      type: isCategorical ? 'categorical' : 'text',
      values: isCategorical ? unique : [],
    }
  })
}

type ActiveFilters = Record<string, Set<string>>

function applyFilters(rows: Record<string, unknown>[], filters: ActiveFilters, search: string): Record<string, unknown>[] {
  return rows.filter((row) => {
    // Check categorical filters
    for (const [key, selected] of Object.entries(filters)) {
      if (selected.size === 0) continue
      const val = String(row[key] ?? '')
      if (!selected.has(val)) return false
    }
    // Check text search
    if (search) {
      const q = search.toLowerCase()
      return Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q))
    }
    return true
  })
}

function countActiveFilters(filters: ActiveFilters, search: string): number {
  let count = search ? 1 : 0
  for (const selected of Object.values(filters)) {
    if (selected.size > 0) count++
  }
  return count
}

// --- Filter Panel Component ---

function FilterPanel({
  fields,
  filters,
  search,
  onToggleValue,
  onSetSearch,
  onClear,
}: {
  fields: FieldMeta[]
  filters: ActiveFilters
  search: string
  onToggleValue: (field: string, value: string) => void
  onSetSearch: (s: string) => void
  onClear: () => void
}) {
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  const hasActive = countActiveFilters(filters, search) > 0

  return (
    <div className="px-4 py-3 border-b border-white/[0.06] space-y-3">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] border border-white/[0.06] px-2.5 py-1.5">
        <Search className="size-3 text-white/25 shrink-0" />
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => onSetSearch(e.target.value)}
          placeholder="Search all fields..."
          className="flex-1 text-xs bg-transparent text-white/70 placeholder:text-white/20 focus:outline-none"
        />
        {search && (
          <button onClick={() => onSetSearch('')} className="text-white/25 hover:text-white/50">
            <X className="size-3" />
          </button>
        )}
      </div>

      {/* Categorical filters */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {fields.filter((f) => f.type === 'categorical').map((field) => (
          <div key={field.key} className="space-y-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">
              {field.label}
            </span>
            <div className="flex flex-wrap gap-1">
              {field.values.map((val) => {
                const isActive = filters[field.key]?.has(val)
                return (
                  <button
                    key={val}
                    onClick={() => onToggleValue(field.key, val)}
                    className={`
                      text-[11px] px-2 py-0.5 rounded-full border transition-all duration-150
                      ${isActive
                        ? 'bg-[#0ea5e9]/15 border-[#0ea5e9]/30 text-[#0ea5e9]'
                        : 'bg-white/[0.03] border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/[0.15]'
                      }
                    `}
                  >
                    {val}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Clear all */}
      {hasActive && (
        <button
          onClick={onClear}
          className="text-[10px] text-white/30 hover:text-white/50 transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}

// --- Main Component ---

export function CrewTable({ data, initialFilters, initialSearch, onPin }: CrewTableProps) {
  const crew = (data.crew as CrewMember[]) || []
  const [sortKey, setSortKey] = useState<SortKey>('role')
  const [sortAsc, setSortAsc] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(!!initialFilters || !!initialSearch)
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(() => {
    if (!initialFilters) return {}
    const result: ActiveFilters = {}
    for (const [k, v] of Object.entries(initialFilters)) {
      result[k] = new Set(v)
    }
    return result
  })
  const [search, setSearch] = useState(initialSearch || '')

  const fields = useMemo(() => analyzeFields(crew as unknown as Record<string, unknown>[]), [crew])

  const filtered = useMemo(
    () => applyFilters(crew as unknown as Record<string, unknown>[], activeFilters, search) as unknown as CrewMember[],
    [crew, activeFilters, search]
  )

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortKey] || ''
    const bVal = b[sortKey] || ''
    return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
  })

  const activeCount = countActiveFilters(activeFilters, search)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  function handleToggleValue(field: string, value: string) {
    setActiveFilters((prev) => {
      const next = { ...prev }
      const set = new Set(next[field] || [])
      if (set.has(value)) {
        set.delete(value)
      } else {
        set.add(value)
      }
      next[field] = set
      return next
    })
  }

  function handleClearFilters() {
    setActiveFilters({})
    setSearch('')
  }

  const SortIcon = ({ field }: { field: SortKey }) => {
    if (sortKey !== field) return null
    return sortAsc
      ? <ChevronUp className="size-3 text-white/30" />
      : <ChevronDown className="size-3 text-white/30" />
  }

  return (
    <div className="
      glass-card rounded-2xl
      bg-white/[0.03] border border-white/[0.08]
      backdrop-blur-md
      overflow-hidden
    ">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#22c55e]" />
          <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Crew
          </span>
          <span className="text-xs text-white/25">
            {activeCount > 0 ? `${filtered.length} / ${crew.length}` : crew.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Filter toggle */}
          {crew.length > 0 && (
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`
                h-7 rounded-lg flex items-center gap-1.5 px-2
                border transition-all duration-200 text-xs
                ${filtersOpen || activeCount > 0
                  ? 'bg-[#0ea5e9]/15 border-[#0ea5e9]/30 text-[#0ea5e9]'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.08] text-white/40 hover:text-white/70'
                }
              `}
            >
              <Filter className="size-3" />
              {activeCount > 0 && (
                <span className="text-[10px] font-medium">{activeCount}</span>
              )}
            </button>
          )}

          {/* Pin */}
          {onPin && (
            <button
              onClick={() => {
                const serialized: SerializedFilters = {}
                for (const [k, v] of Object.entries(activeFilters)) {
                  if (v.size > 0) serialized[k] = [...v]
                }
                onPin({ activeFilters: serialized, search })
              }}
              className="
                size-7 rounded-lg flex items-center justify-center
                border transition-all duration-200
                bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.08] text-white/40 hover:text-white/70
              "
              title="Pin this view to sidebar"
            >
              <Pin className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <FilterPanel
          fields={fields}
          filters={activeFilters}
          search={search}
          onToggleValue={handleToggleValue}
          onSetSearch={setSearch}
          onClear={handleClearFilters}
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] font-medium uppercase tracking-wider text-white/25">
              <th
                onClick={() => toggleSort('name')}
                className="text-left px-4 py-2.5 cursor-pointer hover:text-white/40 transition-colors"
              >
                <span className="flex items-center gap-1">
                  Name <SortIcon field="name" />
                </span>
              </th>
              <th
                onClick={() => toggleSort('role')}
                className="text-left px-4 py-2.5 cursor-pointer hover:text-white/40 transition-colors"
              >
                <span className="flex items-center gap-1">
                  Role <SortIcon field="role" />
                </span>
              </th>
              <th
                onClick={() => toggleSort('position')}
                className="text-left px-4 py-2.5 cursor-pointer hover:text-white/40 transition-colors hidden sm:table-cell"
              >
                <span className="flex items-center gap-1">
                  Position <SortIcon field="position" />
                </span>
              </th>
              <th className="text-left px-4 py-2.5 hidden md:table-cell">
                Email
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((member, i) => (
              <tr
                key={`${member.email}-${i}`}
                className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-medium text-white/40 uppercase">
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="text-sm text-[#e8e9ed]">{member.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border"
                    style={{
                      color: ROLE_COLORS[member.role] || '#0ea5e9',
                      borderColor: `${ROLE_COLORS[member.role] || '#0ea5e9'}30`,
                      backgroundColor: `${ROLE_COLORS[member.role] || '#0ea5e9'}10`,
                    }}
                  >
                    {member.role}
                  </span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs text-white/40">
                    {POSITION_LABELS[member.position] || member.position}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-white/30">{member.email}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="px-4 py-8 text-center">
          <Users className="size-8 text-white/10 mx-auto mb-2" />
          <p className="text-xs text-white/25">
            {activeCount > 0 ? 'No crew match those filters' : 'No crew members yet'}
          </p>
        </div>
      )}
    </div>
  )
}
