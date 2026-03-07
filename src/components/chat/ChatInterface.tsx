'use client'

import { useState, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ChatInput } from './ChatInput'
import { ChatMessage } from './ChatMessage'
import { PinnedSidebar } from './PinnedSidebar'
import { PinnedViewRenderer } from './PinnedViewRenderer'
import { Compass, Menu, X } from 'lucide-react'

interface PinnedView {
  id: string
  label: string
  component_type: string
  query_params: Record<string, unknown>
  folder: string | null
  created_at: string
}

interface ChatInterfaceProps {
  workspaceId: string
  workspaceName: string
  userName: string
  userRole: string
  userId: string
  pinnedViews: PinnedView[]
  crewCount: number
}

export function ChatInterface({
  workspaceId,
  workspaceName,
  userName,
  userRole,
  userId,
  pinnedViews: initialPinnedViews,
  crewCount,
}: ChatInterfaceProps) {
  const [pinnedViews, setPinnedViews] = useState(initialPinnedViews)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [welcomeReady, setWelcomeReady] = useState(false)
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null)

  const selectedView = selectedViewId
    ? pinnedViews.find((v) => v.id === selectedViewId) ?? null
    : null

  const { messages, sendMessage, status, error } = useChat({
    id: `workspace-${workspaceId}`,
    transport: new DefaultChatTransport({
      api: '/api/workspace-chat',
      body: { workspaceId },
    }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // Welcome message typing indicator effect
  useEffect(() => {
    const timer = setTimeout(() => setWelcomeReady(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  // Hide welcome after first message
  useEffect(() => {
    if (messages.length > 0) setShowWelcome(false)
  }, [messages.length])

  function handlePin(view: Omit<PinnedView, 'id' | 'created_at'>) {
    const newView = {
      ...view,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }
    setPinnedViews((prev) => [...prev, newView])
  }

  function handleUnpin(viewId: string) {
    setPinnedViews((prev) => prev.filter((v) => v.id !== viewId))
  }

  function handleRename(viewId: string, newLabel: string) {
    setPinnedViews((prev) =>
      prev.map((v) => (v.id === viewId ? { ...v, label: newLabel } : v))
    )
  }

  return (
    <div className="flex h-screen bg-[#0a0f1e] text-[#e8e9ed]">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden size-10 flex items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm"
      >
        {sidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative z-40 h-full transition-transform duration-200 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <PinnedSidebar
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          pinnedViews={pinnedViews}
          selectedViewId={selectedViewId}
          onSelect={(id) => { setSelectedViewId(id); setSidebarOpen(false) }}
          onUnpin={(id) => { handleUnpin(id); if (selectedViewId === id) setSelectedViewId(null) }}
          onRename={handleRename}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content area */}
      {selectedView ? (
        <PinnedViewRenderer
          view={selectedView}
          onBack={() => setSelectedViewId(null)}
          onPin={handlePin}
        />
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 py-8">
              {/* Welcome state */}
              {showWelcome && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                  {!welcomeReady ? (
                    <div className="flex items-center gap-1.5">
                      <span className="typing-dot size-1.5 rounded-full bg-[#0ea5e9]" style={{ animationDelay: '0ms' }} />
                      <span className="typing-dot size-1.5 rounded-full bg-[#0ea5e9]" style={{ animationDelay: '150ms' }} />
                      <span className="typing-dot size-1.5 rounded-full bg-[#0ea5e9]" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <div className="welcome-appear text-center">
                      <p className="text-xl font-light text-[#e8e9ed]/90 tracking-tight">
                        Hey {userName}. What do you need?
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Chat messages */}
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isLatest={index === messages.length - 1}
                    isStreaming={isLoading && index === messages.length - 1}
                    workspaceId={workspaceId}
                    pinnedViews={pinnedViews}
                    onPin={handlePin}
                    onUnpin={handleUnpin}
                  />
                ))}
              </div>

              {/* Loading indicator */}
              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex items-center gap-1.5 mt-6 ml-1">
                  <span className="typing-dot size-1.5 rounded-full bg-[#0ea5e9]" style={{ animationDelay: '0ms' }} />
                  <span className="typing-dot size-1.5 rounded-full bg-[#0ea5e9]" style={{ animationDelay: '150ms' }} />
                  <span className="typing-dot size-1.5 rounded-full bg-[#0ea5e9]" style={{ animationDelay: '300ms' }} />
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="mt-6 flex items-center gap-3 rounded-2xl bg-red-500/[0.08] border border-red-500/20 px-4 py-3 text-sm text-red-300">
                  <span className="text-lg">🌊</span>
                  <span>Hit some rough water. Try again?</span>
                </div>
              )}
            </div>
          </div>

          {/* Input bar */}
          <ChatInput
            onSend={(text) => sendMessage({ text })}
            isLoading={isLoading}
            crewCount={crewCount}
          />
        </div>
      )}
    </div>
  )
}
