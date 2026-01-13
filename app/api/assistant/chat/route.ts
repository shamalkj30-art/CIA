import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { ASSISTANT_TOOLS, executeTool } from '@/lib/assistant-tools'
import { buildSystemPrompt, generateConversationTitle } from '@/lib/assistant-system-prompt'
import type { ChatRequest, ToolCallRecord } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  // Helper to send SSE events
  function sendEvent(data: Record<string, unknown>): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body: ChatRequest = await request.json()
    const { message, conversation_id, context } = body

    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Get or create conversation
          let conversationId = conversation_id
          let isNewConversation = false

          if (!conversationId) {
            isNewConversation = true
            const { data: newConversation, error: createError } = await supabase
              .from('assistant_conversations')
              .insert({
                user_id: user.id,
                title: generateConversationTitle(message),
                started_page: context.page,
                context_type: context.itemType || 'global',
                context_id: context.itemId || null,
              })
              .select()
              .single()

            if (createError) throw createError
            conversationId = newConversation.id
          } else {
            // Update last_message_at for existing conversation
            await supabase
              .from('assistant_conversations')
              .update({ last_message_at: new Date().toISOString() })
              .eq('id', conversationId)
              .eq('user_id', user.id)
          }

          // Send conversation ID immediately
          controller.enqueue(sendEvent({
            type: 'conversation_id',
            conversation_id: conversationId,
            is_new: isNewConversation,
          }))

          // Get conversation history (last 20 messages)
          const { data: history } = await supabase
            .from('assistant_messages')
            .select('role, content')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .limit(20)

          // Save user message
          await supabase.from('assistant_messages').insert({
            conversation_id: conversationId,
            user_id: user.id,
            role: 'user',
            content: message,
          })

          // Build messages array for Claude
          const messages: Anthropic.MessageParam[] = [
            ...(history || []).map(m => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
            { role: 'user', content: message },
          ]

          // Initialize Anthropic client
          const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY!,
          })

          // Start streaming response
          let fullContent = ''
          const toolCalls: ToolCallRecord[] = []
          let continueLoop = true

          while (continueLoop) {
            const response = await anthropic.messages.create({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 4096,
              system: buildSystemPrompt(context),
              tools: ASSISTANT_TOOLS,
              messages,
              stream: true,
            })

            let currentToolUse: {
              id: string
              name: string
              input: string
            } | null = null

            for await (const event of response) {
              if (event.type === 'content_block_start') {
                if (event.content_block.type === 'tool_use') {
                  currentToolUse = {
                    id: event.content_block.id,
                    name: event.content_block.name,
                    input: '',
                  }
                  controller.enqueue(sendEvent({
                    type: 'tool_call',
                    tool_name: event.content_block.name,
                  }))
                }
              }

              if (event.type === 'content_block_delta') {
                if (event.delta.type === 'text_delta') {
                  fullContent += event.delta.text
                  controller.enqueue(sendEvent({
                    type: 'content',
                    text: event.delta.text,
                  }))
                } else if (event.delta.type === 'input_json_delta' && currentToolUse) {
                  currentToolUse.input += event.delta.partial_json
                }
              }

              if (event.type === 'content_block_stop' && currentToolUse) {
                // Execute the tool
                const toolInput = JSON.parse(currentToolUse.input || '{}')
                const result = await executeTool(
                  currentToolUse.name,
                  toolInput,
                  { supabase, userId: user.id }
                )
                toolCalls.push(result)

                controller.enqueue(sendEvent({
                  type: 'tool_result',
                  tool_name: currentToolUse.name,
                  success: result.success,
                  output: result.output,
                }))

                // Add tool use and result to messages for continuation
                messages.push({
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool_use',
                      id: currentToolUse.id,
                      name: currentToolUse.name,
                      input: toolInput,
                    },
                  ],
                })
                messages.push({
                  role: 'user',
                  content: [
                    {
                      type: 'tool_result',
                      tool_use_id: currentToolUse.id,
                      content: JSON.stringify(result.output),
                    },
                  ],
                })

                currentToolUse = null
              }

              if (event.type === 'message_stop') {
                // Check if we need to continue (no tool calls in this turn)
                continueLoop = false
              }

              if (event.type === 'message_delta') {
                if (event.delta.stop_reason === 'tool_use') {
                  // Continue loop to process tool results
                  continueLoop = true
                } else {
                  continueLoop = false
                }
              }
            }
          }

          // Save assistant message
          await supabase.from('assistant_messages').insert({
            conversation_id: conversationId,
            user_id: user.id,
            role: 'assistant',
            content: fullContent,
            tool_calls: toolCalls.length > 0 ? toolCalls : null,
          })

          // Send completion event
          controller.enqueue(sendEvent({
            type: 'done',
            conversation_id: conversationId,
          }))

          controller.close()
        } catch (error) {
          console.error('Assistant chat error:', error)
          controller.enqueue(sendEvent({
            type: 'error',
            error: error instanceof Error ? error.message : 'An error occurred',
          }))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Assistant chat error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
