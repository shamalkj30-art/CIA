'use client'

import { useState } from 'react'
import type { ToolCallRecord } from '@/lib/types'

interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  toolCalls?: ToolCallRecord[]
  created_at: string
}

interface ChatMessageProps {
  message: UIMessage
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [showToolDetails, setShowToolDetails] = useState(false)
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
      )}

      {/* Message content */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
        {/* Tool calls indicator - shown above message for assistant */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-1.5">
            <button
              onClick={() => setShowToolDetails(!showToolDetails)}
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>
                {message.toolCalls.length} action{message.toolCalls.length > 1 ? 's' : ''} performed
              </span>
              <svg
                className={`w-3 h-3 transition-transform ${showToolDetails ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showToolDetails && (
              <div className="mt-1.5 ml-5 space-y-1">
                {message.toolCalls.map((tc, idx) => (
                  <ToolCallDisplay key={idx} toolCall={tc} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`
            rounded-2xl px-4 py-2.5
            ${
              isUser
                ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-br-md shadow-md'
                : 'bg-[var(--surface-subtle)] text-[var(--text-primary)] rounded-bl-md border border-[var(--border)]'
            }
          `}
        >
          <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm" />
            )}
          </div>
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-[var(--text-muted)] mt-1 px-1">
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  )
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function ToolCallDisplay({ toolCall }: { toolCall: ToolCallRecord }) {
  const toolLabels: Record<string, string> = {
    list_purchases: 'Fetched your purchases',
    get_purchase: 'Got purchase details',
    create_purchase: 'Created new purchase',
    update_purchase: 'Updated purchase',
    delete_purchase: 'Deleted purchase',
    list_subscriptions: 'Fetched your subscriptions',
    create_subscription: 'Created new subscription',
    delete_subscription: 'Deleted subscription',
    generate_cancel_kit: 'Generated cancellation guide',
    list_cases: 'Fetched your cases',
    create_case: 'Created new case',
    generate_case_message: 'Generated message',
    list_vault_items: 'Fetched vault items',
    get_spending_analytics: 'Analyzed your spending',
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
      {toolCall.success ? (
        <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <span>{toolLabels[toolCall.tool_name] || toolCall.tool_name}</span>
    </div>
  )
}
