'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import type {
  AssistantConversation,
  AssistantMessage,
  PageContext,
  ToolCallRecord,
} from '@/lib/types'

interface UIMessage extends Omit<AssistantMessage, 'conversation_id' | 'user_id' | 'tokens_used' | 'model'> {
  isStreaming?: boolean
  toolCalls?: ToolCallRecord[]
}

const CONVERSATION_STORAGE_KEY = 'cyncro_assistant_conversation_id'

interface AssistantContextType {
  // Panel state
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggleOpen: () => void

  // Conversation state
  conversation: AssistantConversation | null
  messages: UIMessage[]
  isLoading: boolean

  // Page context
  pageContext: PageContext
  setPageContext: (ctx: Partial<PageContext>) => void

  // Actions
  sendMessage: (content: string, files?: File[]) => Promise<void>
  startNewConversation: () => void
  loadConversation: (id: string) => Promise<void>
}

const AssistantContext = createContext<AssistantContextType | null>(null)

export function useAssistant() {
  const context = useContext(AssistantContext)
  if (!context) {
    throw new Error('useAssistant must be used within AssistantProvider')
  }
  return context
}

interface AssistantProviderProps {
  children: ReactNode
}

export function AssistantProvider({ children }: AssistantProviderProps) {
  const pathname = usePathname()

  // Panel state
  const [isOpen, setIsOpen] = useState(false)

  // Conversation state
  const [conversation, setConversation] = useState<AssistantConversation | null>(null)
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Page context - updates automatically based on pathname
  const [pageContext, setPageContextState] = useState<PageContext>({
    page: pathname,
  })

  // Update page context when pathname changes
  useEffect(() => {
    setPageContextState(prev => ({
      ...prev,
      page: pathname,
    }))
  }, [pathname])

  // Custom setter that merges context
  const setPageContext = useCallback((ctx: Partial<PageContext>) => {
    setPageContextState(prev => ({ ...prev, ...ctx }))
  }, [])

  // Keyboard shortcut: Cmd/Ctrl + /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Restore conversation from localStorage on mount
  useEffect(() => {
    const storedConversationId = localStorage.getItem(CONVERSATION_STORAGE_KEY)
    if (storedConversationId) {
      // Load the conversation from the database
      fetch(`/api/assistant/conversations/${storedConversationId}`)
        .then(res => {
          if (!res.ok) {
            // Conversation no longer exists, clear storage
            localStorage.removeItem(CONVERSATION_STORAGE_KEY)
            return null
          }
          return res.json()
        })
        .then(data => {
          if (data && data.conversation) {
            setConversation(data.conversation)
            setMessages(
              data.conversation.messages.map((m: AssistantMessage) => ({
                ...m,
                isStreaming: false,
                toolCalls: m.tool_calls || [],
              }))
            )
          }
        })
        .catch(err => {
          console.error('Failed to restore conversation:', err)
          localStorage.removeItem(CONVERSATION_STORAGE_KEY)
        })
    }
  }, [])

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  // Send message with streaming
  const sendMessage = useCallback(async (content: string, files?: File[]) => {
    if ((!content.trim() && (!files || files.length === 0)) || isLoading) return

    setIsLoading(true)

    // Build message content including file info
    let displayContent = content
    let messageWithFiles = content

    if (files && files.length > 0) {
      const fileNames = files.map(f => f.name).join(', ')
      if (displayContent) {
        displayContent = `${displayContent}\n\n📎 Attached: ${fileNames}`
      } else {
        displayContent = `📎 Attached: ${fileNames}`
      }
      // Add file context for the AI
      messageWithFiles = `${content}\n\n[User attached ${files.length} file(s): ${fileNames}. The files have been uploaded for reference.]`
    }

    // Add user message optimistically
    const userMessage: UIMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: displayContent,
      tool_calls: null,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])

    // Add empty assistant message for streaming
    const assistantMessageId = `temp-assistant-${Date.now()}`
    const assistantMessage: UIMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      tool_calls: null,
      created_at: new Date().toISOString(),
      isStreaming: true,
      toolCalls: [],
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageWithFiles,
          conversation_id: conversation?.id,
          context: pageContext,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No response body')

      let streamedContent = ''
      const streamedToolCalls: ToolCallRecord[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          try {
            const data = JSON.parse(line.slice(6))

            switch (data.type) {
              case 'conversation_id':
                // Save conversation ID to localStorage for persistence
                localStorage.setItem(CONVERSATION_STORAGE_KEY, data.conversation_id)
                if (data.is_new) {
                  setConversation({
                    id: data.conversation_id,
                    user_id: '',
                    title: (content || 'File attachment').substring(0, 50),
                    started_page: pageContext.page,
                    context_type: pageContext.itemType || 'global',
                    context_id: pageContext.itemId || null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    last_message_at: new Date().toISOString(),
                  })
                }
                break

              case 'content':
                streamedContent += data.text
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMessageId
                      ? { ...m, content: streamedContent }
                      : m
                  )
                )
                break

              case 'tool_call':
                // Tool call started
                break

              case 'tool_result':
                streamedToolCalls.push({
                  tool_name: data.tool_name,
                  input: {},
                  output: data.output,
                  success: data.success,
                })
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMessageId
                      ? { ...m, toolCalls: [...streamedToolCalls] }
                      : m
                  )
                )
                break

              case 'done':
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMessageId
                      ? { ...m, isStreaming: false }
                      : m
                  )
                )
                break

              case 'error':
                throw new Error(data.error)
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    } catch (error) {
      console.error('Send message error:', error)
      // Remove the streaming message on error
      setMessages(prev => prev.filter(m => m.id !== assistantMessageId))
      // Could add error toast here
    } finally {
      setIsLoading(false)
    }
  }, [conversation?.id, pageContext, isLoading])

  // Start a new conversation
  const startNewConversation = useCallback(() => {
    localStorage.removeItem(CONVERSATION_STORAGE_KEY)
    setConversation(null)
    setMessages([])
  }, [])

  // Load an existing conversation
  const loadConversation = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/assistant/conversations/${id}`)
      if (!response.ok) throw new Error('Failed to load conversation')

      const data = await response.json()
      setConversation(data.conversation)
      setMessages(
        data.conversation.messages.map((m: AssistantMessage) => ({
          ...m,
          isStreaming: false,
          toolCalls: m.tool_calls || [],
        }))
      )
    } catch (error) {
      console.error('Load conversation error:', error)
    }
  }, [])

  return (
    <AssistantContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggleOpen,
        conversation,
        messages,
        isLoading,
        pageContext,
        setPageContext,
        sendMessage,
        startNewConversation,
        loadConversation,
      }}
    >
      {children}
    </AssistantContext.Provider>
  )
}
