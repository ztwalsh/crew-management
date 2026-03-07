import type { UIMessage } from 'ai'
import { ToolResultCard } from './tool-result-card'
import { Bot, User } from 'lucide-react'

interface MessageBubbleProps {
  message: UIMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-[#0EA5E9]/10' : 'bg-[#22252F]'
        }`}
      >
        {isUser ? (
          <User className="size-3.5 text-[#0EA5E9]" />
        ) : (
          <Bot className="size-3.5 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {message.parts.map((part, i) => {
          if (part.type === 'text') {
            if (!part.text) return null
            return (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#0EA5E9] text-white'
                    : 'bg-[#22252F] text-foreground'
                }`}
              >
                <MessageText text={part.text} />
              </div>
            )
          }

          // Handle tool parts — type is `tool-{name}` or `dynamic-tool`
          if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
            const toolPart = part as any
            if (toolPart.state === 'output-available') {
              const toolName = toolPart.type === 'dynamic-tool'
                ? toolPart.toolName
                : toolPart.type.replace(/^tool-/, '')
              return (
                <ToolResultCard
                  key={i}
                  toolName={toolName}
                  result={toolPart.output}
                />
              )
            }
            if (toolPart.state === 'error') {
              return (
                <div key={i} className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
                  Tool error: {toolPart.errorText || 'Unknown error'}
                </div>
              )
            }
            // In-progress tool call
            const toolName = toolPart.type === 'dynamic-tool'
              ? toolPart.toolName
              : toolPart.type.replace(/^tool-/, '')
            return (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                <div className="size-1.5 rounded-full bg-[#0EA5E9] animate-pulse" />
                {formatToolName(toolName)}...
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}

function MessageText({ text }: { text: string }) {
  // Simple markdown-ish rendering: bold, inline code, line breaks
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\n)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part === '\n') return <br key={i} />
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="rounded bg-black/20 px-1 py-0.5 text-[13px]">
              {part.slice(1, -1)}
            </code>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

function formatToolName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
