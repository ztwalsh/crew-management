'use client'

import { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { useParams } from 'next/navigation'
import { DefaultChatTransport } from 'ai'
import { X, Send, Bot, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessageBubble } from './message-bubble'

interface CopilotPanelProps {
  open: boolean
  onClose: () => void
}

export function CopilotPanel({ open, onClose }: CopilotPanelProps) {
  const params = useParams()
  const boatId = params?.boatId as string | undefined
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [inputValue, setInputValue] = useState('')

  const { messages, sendMessage, status, error } = useChat({
    id: boatId ? `copilot-${boatId}` : undefined,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { boatId },
    }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (inputValue.trim() && !isLoading) {
      sendMessage({ text: inputValue.trim() })
      setInputValue('')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  if (!boatId) return null

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-96 bg-background border-l border-border flex flex-col transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Bot className="size-4 text-[#0EA5E9]" />
            <span className="text-sm font-semibold">Copilot</span>
          </div>
          <Button variant="ghost" size="icon" className="size-8" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#0EA5E9]/10 mb-3">
                <Bot className="size-6 text-[#0EA5E9]" />
              </div>
              <p className="text-sm font-medium mb-1">Crew Copilot</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ask me to create events, invite crew, check availability, or manage your boat.
              </p>
              <div className="mt-4 space-y-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setInputValue(s)
                      inputRef.current?.focus()
                    }}
                    className="block w-full text-left rounded-lg border border-border/50 bg-[#22252F] px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-[#0EA5E9]/30 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <Loader2 className="size-3.5 animate-spin" />
              Thinking...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
              {error.message || 'Something went wrong. Please try again.'}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-border p-3">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              rows={1}
              className="flex-1 resize-none rounded-lg border border-border/50 bg-[#22252F] px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]/50 max-h-32"
              style={{ minHeight: '38px' }}
            />
            <Button
              type="submit"
              size="icon"
              className="size-9 shrink-0 bg-[#0EA5E9] hover:bg-[#0EA5E9]/80"
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className="size-4" />
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  )
}

const SUGGESTIONS = [
  'Who is on the crew?',
  'What events are coming up?',
  'Create practice sessions every Tuesday at 6pm for March',
  'Who hasn\'t RSVP\'d for the next race?',
]
