'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUp } from 'lucide-react'

interface ChatInputProps {
  onSend: (text: string) => void
  isLoading: boolean
  crewCount: number
}

const PLACEHOLDERS = [
  'Add Sarah Chen as first mate...',
  'Who\'s crewing the Thursday race?',
  'Message all crew about the schedule change...',
  'Create a practice session for Saturday at 2pm...',
  'Show me the crew roster...',
  'Who hasn\'t RSVP\'d for the next race?',
]

export function ChatInput({ onSend, isLoading, crewCount }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [value])

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim()
    if (trimmed && !isLoading) {
      onSend(trimmed)
      setValue('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }, [value, isLoading, onSend])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave() {
    setIsDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)

    const file = e.dataTransfer.files?.[0]
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const csvText = event.target?.result as string
        if (csvText) {
          onSend(`Import this crew CSV:\n\`\`\`\n${csvText}\n\`\`\``)
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div
      className="relative shrink-0 p-4 pb-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0f1e]/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-[#0ea5e9]">
            <div className="size-12 rounded-full border-2 border-dashed border-[#0ea5e9]/50 flex items-center justify-center">
              <ArrowUp className="size-5" />
            </div>
            <p className="text-sm font-medium">Drop to import crew</p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className={`
          chat-input-bar relative flex items-end gap-2
          rounded-[24px] border border-white/[0.08]
          bg-white/[0.04] backdrop-blur-sm
          px-4 py-2.5
          transition-all duration-200
          focus-within:border-[#0ea5e9]/30
          focus-within:shadow-[0_0_20px_rgba(14,165,233,0.08)]
        `}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDERS[placeholderIndex]}
            rows={1}
            className="
              flex-1 resize-none bg-transparent
              text-sm text-[#e8e9ed] placeholder:text-white/30
              focus:outline-none
              leading-relaxed
            "
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || isLoading}
            className={`
              shrink-0 size-8 rounded-full flex items-center justify-center
              transition-all duration-200
              ${value.trim() && !isLoading
                ? 'bg-[#0ea5e9] text-white hover:bg-[#0ea5e9]/80 scale-100'
                : 'bg-white/[0.06] text-white/20 scale-95'
              }
            `}
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
