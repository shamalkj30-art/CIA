import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { ASSISTANT_TOOLS, executeTool } from '@/lib/assistant-tools'
import { buildSystemPrompt, generateConversationTitle } from '@/lib/assistant-system-prompt'
import type { ChatRequest, ToolCallRecord, ChatAttachment } from '@/lib/types'
import { getLLMProvider, convertFromAnthropicTools } from '@/lib/llm'
import type { Message, MessageContent, Tool } from '@/lib/llm'

// Uploaded file metadata type
interface UploadedFileMetadata {
  storage_path: string
  file_name: string
  file_type: string
  file_size: number
}

// Helper to check if attachment is a PDF
function isPdf(attachment: ChatAttachment): boolean {
  return attachment.type === 'application/pdf' || attachment.name.toLowerCase().endsWith('.pdf')
}

// Helper to check if attachment is an image
function isImage(attachment: ChatAttachment): boolean {
  return attachment.type.startsWith('image/')
}

// Upload attachment to Supabase storage
async function uploadAttachmentToStorage(
  supabase: SupabaseClient,
  userId: string,
  attachment: ChatAttachment
): Promise<UploadedFileMetadata | null> {
  try {
    const timestamp = Date.now()
    const sanitizedName = attachment.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `${userId}/${timestamp}_${sanitizedName}`

    // Convert base64 to buffer
    const buffer = Buffer.from(attachment.data, 'base64')

    // Determine content type
    let contentType = attachment.type
    const fileName = attachment.name.toLowerCase()

    if (!contentType || contentType === 'application/octet-stream') {
      if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
        contentType = 'image/jpeg'
      } else if (fileName.endsWith('.png')) {
        contentType = 'image/png'
      } else if (fileName.endsWith('.pdf')) {
        contentType = 'application/pdf'
      } else if (fileName.endsWith('.webp')) {
        contentType = 'image/webp'
      }
    }

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(storagePath, buffer, {
        contentType: contentType || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error('[Assistant] Storage upload error:', uploadError)
      return null
    }

    console.log(`[Assistant] Uploaded file to storage: ${storagePath}`)

    return {
      storage_path: storagePath,
      file_name: attachment.name,
      file_type: attachment.type || contentType,
      file_size: attachment.size,
    }
  } catch (error) {
    console.error('[Assistant] Failed to upload attachment:', error)
    return null
  }
}

// Extract text from PDF attachment
async function extractPdfText(attachment: ChatAttachment): Promise<string | null> {
  if (!isPdf(attachment)) {
    return null
  }

  try {
    const { extractTextFromPdf } = await import('@/lib/pdf-to-image')
    const buffer = Buffer.from(attachment.data, 'base64')
    const text = await extractTextFromPdf(buffer.buffer as ArrayBuffer)
    return text && text.trim().length > 10 ? text : null
  } catch (error) {
    console.log('[Assistant] PDF text extraction failed:', error)
    return null
  }
}

// Helper to convert attachment to unified image content
function attachmentToImageContent(attachment: ChatAttachment): MessageContent | null {
  if (!isImage(attachment)) {
    return null
  }

  // Map MIME types to supported types
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
      mediaType: mediaType,
      data: attachment.data,
    },
  }
}

// Result of building message content
interface MessageBuildResult {
  content: MessageContent[] | string
  uploadedFiles: UploadedFileMetadata[]
}

// Build multimodal content from message and attachments (async to support PDF extraction)
async function buildMessageContent(
  message: string,
  attachments: ChatAttachment[] | undefined,
  supabase: SupabaseClient,
  userId: string
): Promise<MessageBuildResult> {
  if (!attachments || attachments.length === 0) {
    return { content: message, uploadedFiles: [] }
  }

  const content: MessageContent[] = []
  const pdfTexts: { name: string; text: string }[] = []
  const processedFiles: string[] = []
  const unsupportedFiles: string[] = []
  const uploadedFiles: UploadedFileMetadata[] = []

  // Process all attachments
  for (const attachment of attachments) {
    // Upload file to storage first (for all valid file types)
    if (isImage(attachment) || isPdf(attachment)) {
      const uploadResult = await uploadAttachmentToStorage(supabase, userId, attachment)
      if (uploadResult) {
        uploadedFiles.push(uploadResult)
      }
    }

    if (isImage(attachment)) {
      // Add image content for Claude Vision
      const imageContent = attachmentToImageContent(attachment)
      if (imageContent) {
        content.push(imageContent)
        processedFiles.push(`${attachment.name} (image)`)
      }
    } else if (isPdf(attachment)) {
      // Extract text from PDF
      const pdfText = await extractPdfText(attachment)
      if (pdfText) {
        pdfTexts.push({ name: attachment.name, text: pdfText })
        processedFiles.push(`${attachment.name} (PDF - text extracted)`)
      } else {
        unsupportedFiles.push(`${attachment.name} (PDF - could not extract text, may be image-based)`)
      }
    } else {
      // Unsupported file type
      unsupportedFiles.push(`${attachment.name} (${attachment.type} - not supported)`)
    }
  }

  // Build the text message with context about attached files
  let textContent = message.trim()

  // Add PDF text content
  if (pdfTexts.length > 0) {
    textContent += '\n\n--- ATTACHED PDF CONTENT ---'
    for (const pdf of pdfTexts) {
      textContent += `\n\n[Content from ${pdf.name}]:\n${pdf.text}`
    }
    textContent += '\n--- END PDF CONTENT ---'
  }

  // Add info about uploaded files (so Claude can reference them for document attachment)
  if (uploadedFiles.length > 0) {
    textContent += '\n\n--- UPLOADED FILE INFO (for document attachment) ---'
    textContent += '\nThese files have been uploaded and can be attached to purchases:'
    for (const file of uploadedFiles) {
      textContent += `\n- ${file.file_name}: storage_path="${file.storage_path}", file_type="${file.file_type}", file_size=${file.file_size}`
    }
    textContent += '\n\nWhen creating a purchase, include the document info to attach the receipt.'
    textContent += '\n--- END UPLOADED FILE INFO ---'
  }

  // Add info about unsupported files
  if (unsupportedFiles.length > 0) {
    textContent += `\n\n[Note: The following files could not be processed: ${unsupportedFiles.join(', ')}]`
  }

  // Add the text content
  if (textContent.trim()) {
    content.push({
      type: 'text',
      text: textContent,
    })
  } else if (content.length === 0) {
    // No images and no text - shouldn't happen but handle gracefully
    content.push({
      type: 'text',
      text: 'Please analyze the attached file(s) and extract any relevant information.',
    })
  }

  console.log(`[Assistant] Processed files: ${processedFiles.join(', ') || 'none'}`)
  console.log(`[Assistant] Uploaded files: ${uploadedFiles.length}`)
  if (unsupportedFiles.length > 0) {
    console.log(`[Assistant] Unsupported files: ${unsupportedFiles.join(', ')}`)
  }

  return { content, uploadedFiles }
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

          // Build messages array for LLM (including file upload)
          const { content: messageContent, uploadedFiles } = await buildMessageContent(
            message || '',
            attachments,
            supabase,
            user.id
          )
          const messages: Message[] = [
            ...(history || []).map(m => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
            {
              role: 'user' as const,
              content: messageContent,
            },
          ]

          // Get LLM provider (configurable via LLM_PROVIDER env var)
          const llm = getLLMProvider()
          const tools = convertFromAnthropicTools(ASSISTANT_TOOLS)

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

            // Call LLM using unified interface
            const response = await llm.chat(messages, {
              maxTokens: 4096,
              systemPrompt: buildSystemPrompt(context),
              tools,
            })

            console.log(`[Assistant] Response stop_reason: ${response.stopReason}`)
            console.log(`[Assistant] Response has content: ${!!response.content}`)
            console.log(`[Assistant] Response tool calls: ${response.toolCalls.length}`)

            // Process text content
            if (response.content) {
              fullContent += response.content
              // Send text in chunks for a streaming-like experience
              controller.enqueue(sendEvent({
                type: 'content',
                text: response.content,
              }))
            }

            // Process tool calls
            for (const toolCall of response.toolCalls) {
              console.log(`[Assistant] Processing tool call: ${toolCall.name}`)

              controller.enqueue(sendEvent({
                type: 'tool_call',
                tool_name: toolCall.name,
              }))

              // Execute the tool
              console.log(`[Assistant] Executing tool: ${toolCall.name}`)
              const result = await executeTool(
                toolCall.name,
                toolCall.input,
                { supabase, userId: user.id }
              )
              toolCalls.push(result)
              console.log(`[Assistant] Tool result success: ${result.success}`)

              controller.enqueue(sendEvent({
                type: 'tool_result',
                tool_name: toolCall.name,
                success: result.success,
                output: result.output,
              }))

              // Add tool use and result to messages for continuation
              messages.push({
                role: 'assistant',
                content: [
                  {
                    type: 'tool_use',
                    id: toolCall.id,
                    name: toolCall.name,
                    input: toolCall.input,
                  },
                ],
              })
              messages.push({
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    toolUseId: toolCall.id,
                    content: JSON.stringify(result.output),
                  },
                ],
              })
            }

            // Check if we need to continue (tool_use means we need another round)
            if (response.stopReason === 'tool_use') {
              continueLoop = true
              console.log(`[Assistant] Continue loop for tool results`)
            } else {
              continueLoop = false
            }

            console.log(`[Assistant] Loop #${loopCount} completed, stop_reason: ${response.stopReason}, continueLoop: ${continueLoop}`)
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
