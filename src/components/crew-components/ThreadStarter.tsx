'use client'

import { useState } from 'react'
import { MessageSquare, X, Send } from 'lucide-react'

interface ThreadStarterProps {
  data: Record<string, unknown>
  workspaceId: string
}

interface Recipient {
  name: string
  email: string
}

export function ThreadStarter({ data, workspaceId }: ThreadStarterProps) {
  const recipients = (data.recipients as Recipient[]) || []
  const suggestedTitle = (data.title as string) || ''
  const [title, setTitle] = useState(suggestedTitle)
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState<Set<string>>(
    new Set(recipients.map((r) => r.email))
  )
  const [created, setCreated] = useState(false)

  function toggleRecipient(email: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(email)) next.delete(email)
      else next.add(email)
      return next
    })
  }

  function handleCreate() {
    setCreated(true)
  }

  if (created) {
    return (
      <div className="
        inline-flex items-center gap-3
        rounded-2xl bg-white/[0.04] border border-white/[0.06]
        px-4 py-2.5
      ">
        <MessageSquare className="size-4 text-[#ec4899]/60" />
        <span className="text-sm text-[#e8e9ed]/80">
          Thread &ldquo;{title || 'Untitled'}&rdquo; started
        </span>
      </div>
    )
  }

  return (
    <div className="
      glass-card rounded-2xl
      bg-white/[0.03] border border-white/[0.08]
      backdrop-blur-md overflow-hidden max-w-md
    ">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <span className="size-2 rounded-full bg-[#ec4899]" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">
          New Thread
        </span>
      </div>

      {/* Title */}
      <div className="px-4 pt-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Thread title..."
          className="
            w-full bg-transparent text-sm font-medium text-[#e8e9ed]
            placeholder:text-white/20 focus:outline-none
          "
        />
      </div>

      {/* Recipients */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Members</p>
        <div className="flex flex-wrap gap-1.5">
          {recipients.map((r) => {
            const isSelected = selected.has(r.email)
            return (
              <button
                key={r.email}
                onClick={() => toggleRecipient(r.email)}
                className={`
                  inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full
                  border transition-all duration-150
                  ${isSelected
                    ? 'bg-[#ec4899]/10 border-[#ec4899]/30 text-[#ec4899]/80'
                    : 'bg-white/[0.02] border-white/[0.06] text-white/25 line-through'
                  }
                `}
              >
                {r.name.split(' ')[0]}
                {isSelected && <X className="size-2.5 ml-0.5" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* First message */}
      <div className="p-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="First message..."
          rows={3}
          className="
            w-full resize-none bg-transparent text-sm text-[#e8e9ed]
            placeholder:text-white/20 focus:outline-none leading-relaxed
          "
        />
      </div>

      {/* Create */}
      <div className="px-4 pb-4 flex justify-end">
        <button
          onClick={handleCreate}
          disabled={selected.size === 0 || !message.trim()}
          className={`
            flex items-center gap-2 text-xs px-4 py-2 rounded-full
            transition-all duration-200
            ${selected.size > 0 && message.trim()
              ? 'bg-[#ec4899] text-white hover:bg-[#ec4899]/80'
              : 'bg-white/[0.04] text-white/20 cursor-not-allowed'
            }
          `}
        >
          <Send className="size-3" />
          Start Thread
        </button>
      </div>
    </div>
  )
}
