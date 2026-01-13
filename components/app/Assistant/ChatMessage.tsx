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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-2.5
          ${
            isUser
              ? 'bg-[var(--primary)] text-white rounded-br-md'
              : 'bg-[var(--surface-subtle)] text-[var(--text-primary)] rounded-bl-md'
          }
        `}
      >
        {/* Tool calls indicator */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-2">
            <button
              onClick={() => setShowToolDetails(!showToolDetails)}
              className="flex items-center gap-1.5 text-xs opacity-70 hover:opacity-100 transition-opacity"
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
              <div className="mt-2 space-y-1.5">
                {message.toolCalls.map((tc, idx) => (
                  <ToolCallDisplay key={idx} toolCall={tc} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message content */}
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm" />
          )}
        </div>
      </div>
    </div>
  )
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
    generate_cancel_kit: 'Generated cancellation guide',
    list_cases: 'Fetched your cases',
    create_case: 'Created new case',
    generate_case_message: 'Generated message',
    list_vault_items: 'Fetched vault items',
    get_spending_analytics: 'Analyzed your spending',
  }

  return (
    <div className="flex items-center gap-1.5 text-xs opacity-70">
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
