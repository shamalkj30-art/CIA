import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { ASSISTANT_TOOLS, executeTool } from '@/lib/assistant-tools'
import { buildSystemPrompt, generateConversationTitle } from '@/lib/assistant-system-prompt'
import type { ChatRequest, ToolCallRecord, ChatAttachment } from '@/lib/types'

// Helper to convert attachment to Claude image content
function attachmentToImageContent(attachment: ChatAttachment): Anthropic.ImageBlockParam | null {
  // Check if it's an image type
  if (!attachment.type.startsWith('image/')) {
    return null
  }

  // Map MIME types to Claude-supported types
  let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg'

  if (attachment.type === 'image/png') {
    mediaType = 'image/png'
  } else if (attachment.type === 'image/gif') {
    mediaType = 'image/gif'
  } else if (attachment.type === 'image/webp') {
    mediaType = 'image/webp'
  }
  // For other image types (heic, tiff, bmp), default to jpeg

  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: mediaType,
      data: attachment.data,
    },
  }
}

// Build multimodal content from message and attachments
function buildMessageContent(message: string, attachments?: ChatAttachment[]): Anthropic.ContentBlockParam[] | string {
  if (!attachments || attachments.length === 0) {
    return message
  }

  const content: Anthropic.ContentBlockParam[] = []

  // Add image attachments first
  for (const attachment of attachments) {
    const imageContent = attachmentToImageContent(attachment)
    if (imageContent) {
      content.push(imageContent)
    }
  }

  // Add the text message
  if (message.trim()) {
    content.push({
      type: 'text',
      text: message,
    })
  } else {
    // Default message when only files are attached
    content.push({
      type: 'text',
      text: 'Please analyze the attached file(s) and extract any relevant information.',
    })
  }

  return content
}

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
    const { message, conversation_id, context, attachments } = body

    if (!message?.trim() && (!attachments || attachments.length === 0)) {
      return new Response(
        JSON.stringify({ error: 'Message or attachments required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Log attachment info
    if (attachments && attachments.length > 0) {
      console.log(`[Assistant] Received ${attachments.length} attachment(s):`, attachments.map(a => ({ name: a.name, type: a.type, size: a.size })))
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
            {
              role: 'user',
              content: buildMessageContent(message || '', attachments),
            },
          ]

          // Initialize Anthropic client
          const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY!,
          })

          // Start streaming response
          let fullContent = ''
          const toolCalls: ToolCallRecord[] = []
          let continueLoop = true
          let loopCount = 0
          const maxLoops = 5 // Prevent infinite loops

          console.log('[Assistant] Starting chat, message:', message)

          while (continueLoop && loopCount < maxLoops) {
            loopCount++
            console.log(`[Assistant] API call #${loopCount}`)

            // Using non-streaming for now to debug empty responses
            const response = await anthropic.messages.create({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 4096,
              system: buildSystemPrompt(context),
              tools: ASSISTANT_TOOLS,
              messages,
            })

            console.log(`[Assistant] Response stop_reason: ${response.stop_reason}`)
            console.log(`[Assistant] Response content blocks: ${response.content.length}`)

            // Process response content
            for (const block of response.content) {
              console.log(`[Assistant] Processing block type: ${block.type}`)

              if (block.type === 'text') {
                fullContent += block.text
                // Send text in chunks for a streaming-like experience
                controller.enqueue(sendEvent({
                  type: 'content',
                  text: block.text,
                }))
              } else if (block.type === 'tool_use') {
                controller.enqueue(sendEvent({
                  type: 'tool_call',
                  tool_name: block.name,
                }))

                // Execute the tool
                console.log(`[Assistant] Executing tool: ${block.name}`)
                const result = await executeTool(
                  block.name,
                  block.input as Record<string, unknown>,
                  { supabase, userId: user.id }
                )
                toolCalls.push(result)
                console.log(`[Assistant] Tool result success: ${result.success}`)

                controller.enqueue(sendEvent({
                  type: 'tool_result',
                  tool_name: block.name,
                  success: result.success,
                  output: result.output,
                }))

                // Add tool use and result to messages for continuation
                messages.push({
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool_use',
                      id: block.id,
                      name: block.name,
                      input: block.input,
                    },
                  ],
                })
                messages.push({
                  role: 'user',
                  content: [
                    {
                      type: 'tool_result',
                      tool_use_id: block.id,
                      content: JSON.stringify(result.output),
                    },
                  ],
                })
              }
            }

            // Check if we need to continue (tool_use means we need another round)
            if (response.stop_reason === 'tool_use') {
              continueLoop = true
              console.log(`[Assistant] Continue loop for tool results`)
            } else {
              continueLoop = false
            }

            console.log(`[Assistant] Loop #${loopCount} completed, stop_reason: ${response.stop_reason}, continueLoop: ${continueLoop}`)
          }

          console.log(`[Assistant] Final content length: ${fullContent.length}, toolCalls: ${toolCalls.length}`)

          // Fallback: If no content was generated, generate a default response
          if (!fullContent.trim() && toolCalls.length === 0) {
            console.log('[Assistant] WARNING: No content generated, using fallback')
            fullContent = "I apologize, but I encountered an issue processing your message. Could you please try rephrasing your request?"
            controller.enqueue(sendEvent({
              type: 'content',
              text: fullContent,
            }))
          } else if (!fullContent.trim() && toolCalls.length > 0) {
            // Tools were called but no text summary was generated
            console.log('[Assistant] WARNING: Tools called but no summary generated, using fallback')
            fullContent = "I've processed your request. The actions have been completed."
            controller.enqueue(sendEvent({
              type: 'content',
              text: fullContent,
            }))
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
