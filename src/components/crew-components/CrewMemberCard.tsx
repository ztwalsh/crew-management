'use client'

import { Mail, Phone, Edit2, UserMinus } from 'lucide-react'

interface CrewMemberCardProps {
  data: Record<string, unknown>
}

const ROLE_COLORS: Record<string, string> = {
  owner: '#f59e0b',
  admin: '#a855f7',
  crew: '#0ea5e9',
}

export function CrewMemberCard({ data }: CrewMemberCardProps) {
  // Handle single crew member from list_crew
  const crew = data.crew as Array<{
    name: string
    email: string
    role: string
    position: string
    joined: string
  }> | undefined

  const member = crew?.[0] || {
    name: (data.name as string) || 'Unknown',
    email: (data.email as string) || '',
    role: (data.role as string) || 'crew',
    position: (data.position as string) || 'unassigned',
    joined: (data.joined as string) || '',
  }

  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="
      glass-card rounded-2xl
      bg-white/[0.03] border border-white/[0.08]
      backdrop-blur-md
      p-5 max-w-sm
    ">
      {/* Accent dot */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="size-12 rounded-full bg-white/[0.06] flex items-center justify-center text-sm font-medium text-white/40">
            {initials}
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#e8e9ed]">{member.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10px] font-medium uppercase tracking-wider"
                style={{ color: ROLE_COLORS[member.role] || '#0ea5e9' }}
              >
                {member.role}
              </span>
              {member.position && member.position !== 'unassigned' && (
                <>
                  <span className="text-white/10">·</span>
                  <span className="text-[10px] text-white/40 capitalize">
                    {member.position}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <span className="size-2 rounded-full bg-[#22c55e]" />
      </div>

      {/* Contact info */}
      <div className="space-y-2 mb-4">
        {member.email && (
          <div className="flex items-center gap-2.5 text-xs text-white/40">
            <Mail className="size-3.5 text-white/20" />
            {member.email}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
        <button className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/[0.04]">
          <Mail className="size-3" />
          Message
        </button>
        <button className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/[0.04]">
          <Edit2 className="size-3" />
          Edit
        </button>
        <button className="flex items-center gap-1.5 text-xs text-red-400/40 hover:text-red-400/80 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-500/[0.04]">
          <UserMinus className="size-3" />
          Remove
        </button>
      </div>
    </div>
  )
}
