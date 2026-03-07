'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Bot } from 'lucide-react'
import { CopilotPanel } from './copilot-panel'

export function CopilotTrigger() {
  const params = useParams()
  const boatId = params?.boatId as string | undefined
  const [open, setOpen] = useState(false)

  // Keyboard shortcut: Cmd+J to toggle copilot
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      // Escape closes the panel
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    },
    [open]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Only show the copilot when viewing a specific boat
  if (!boatId) return null

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex size-12 items-center justify-center rounded-full bg-[#0EA5E9] text-white shadow-lg shadow-[#0EA5E9]/20 hover:bg-[#0EA5E9]/90 hover:scale-105 transition-all md:bottom-6 md:right-6"
        aria-label="Open Copilot"
      >
        <Bot className="size-5" />
      </button>

      <CopilotPanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}
