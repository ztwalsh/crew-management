'use client'

import { type UIMessage } from 'ai'
import { ComponentRenderer } from './ComponentRenderer'

interface ChatMessageProps {
  message: UIMessage
  isLatest: boolean
  isStreaming: boolean
  workspaceId: string
  pinnedViews?: { id: string; component_type: string }[]
  onPin: (view: {
    label: string
    component_type: string
    query_params: Record<string, unknown>
    folder: string | null
  }) => void
  onUnpin?: (viewId: string) => void
}

export function ChatMessage({
  message,
  isLatest,
  isStreaming,
  workspaceId,
  pinnedViews,
  onPin,
  onUnpin,
}: ChatMessageProps) {
  const isUser = message.role === 'user'

  // Extract text content from message parts
  const textParts = message.parts
    ?.filter((part): part is Extract<typeof part, { type: 'text' }> => part.type === 'text')
    .map((part) => part.text)
    .join('') || ''

  // Strip component annotations from displayed text
  const textContent = textParts.replace(/\[component:\w+\]\s*$/gm, '').trim()

  // Parse component hint from message text
  const componentMatch = textParts.match(/\[component:(\w+)\]/)
  const componentHint = componentMatch?.[1]

  // Extract tool parts (they have type like "tool-list_crew", "tool-create_event", etc.)
  const toolResults: Array<{ toolName: string; output: unknown; key: number }> = []

  message.parts?.forEach((part, i) => {
    // Tool parts have type starting with "tool-" or "dynamic-tool"
    if (typeof part.type === 'string' && (part.type.startsWith('tool-') || part.type === 'dynamic-tool')) {
      const toolPart = part as any
      if (toolPart.state === 'output-available') {
        const toolName = toolPart.type === 'dynamic-tool'
          ? toolPart.toolName
          : toolPart.type.replace(/^tool-/, '')
        toolResults.push({ toolName, output: toolPart.output, key: i })
      }
    }
  })

  return (
    <div className={`chat-message-${isUser ? 'user' : 'ai'} ${isLatest && !isUser ? 'latest' : ''}`}>
      {isUser ? (
        /* User message */
        <div className="flex justify-end">
          <div className="
            max-w-[80%] rounded-2xl rounded-br-md
            bg-[#0ea5e9]/15 border border-[#0ea5e9]/20
            px-4 py-2.5 text-sm text-[#e8e9ed]
            leading-relaxed
            animate-slide-in-right
          ">
            {textContent}
          </div>
        </div>
      ) : (
        /* AI message */
        <div className="space-y-3">
          {textContent && (
            <div className="
              text-sm text-[#e8e9ed]/85 leading-[1.7]
              font-light tracking-[0.01em]
              max-w-[90%]
            ">
              <MessageText text={textContent} />
            </div>
          )}

          {/* Render components from tool results */}
          {toolResults.map(({ toolName, output, key }) => (
            <div key={key} className="component-materialize mt-2">
              <ComponentRenderer
                toolName={toolName}
                toolResult={output}
                componentHint={componentHint}
                workspaceId={workspaceId}
                pinnedViews={pinnedViews}
                onPin={onPin}
                onUnpin={onUnpin}
              />
            </div>
          ))}

          {/* Show in-progress tool calls */}
          {message.parts?.map((part, i) => {
            if (typeof part.type === 'string' && (part.type.startsWith('tool-') || part.type === 'dynamic-tool')) {
              const toolPart = part as any
              if (toolPart.state !== 'output-available' && toolPart.state !== 'error') {
                const toolName = toolPart.type === 'dynamic-tool'
                  ? toolPart.toolName
                  : toolPart.type.replace(/^tool-/, '')
                return (
                  <div key={i} className="flex items-center gap-1.5 ml-1">
                    <span className="typing-dot size-1.5 rounded-full bg-[#0ea5e9]" style={{ animationDelay: '0ms' }} />
                    <span className="typing-dot size-1.5 rounded-full bg-[#0ea5e9]" style={{ animationDelay: '150ms' }} />
                    <span className="typing-dot size-1.5 rounded-full bg-[#0ea5e9]" style={{ animationDelay: '300ms' }} />
                    <span className="text-xs text-white/25 ml-1">
                      {formatToolName(toolName)}
                    </span>
                  </div>
                )
              }
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}

function MessageText({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\n)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part === '\n') return <br key={i} />
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-medium text-[#e8e9ed]">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-[#0ea5e9]/80">
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
