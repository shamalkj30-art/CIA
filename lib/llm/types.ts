/**
 * LLM Abstraction Layer - Unified Types
 *
 * These types provide a unified interface for different LLM providers
 * (Anthropic Claude, OpenAI GPT, Google Gemini, etc.)
 */

// =============================================================================
// MESSAGE TYPES
// =============================================================================

export type MessageRole = 'user' | 'assistant' | 'system'

export interface TextContent {
  type: 'text'
  text: string
}

export interface ImageContent {
  type: 'image'
  source: {
    type: 'base64' | 'url'
    mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    data: string // base64 data or URL
  }
}

export interface ToolUseContent {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ToolResultContent {
  type: 'tool_result'
  toolUseId: string
  content: string
}

export type MessageContent = TextContent | ImageContent | ToolUseContent | ToolResultContent

export interface Message {
  role: MessageRole
  content: string | MessageContent[]
}

// =============================================================================
// TOOL TYPES
// =============================================================================

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description?: string
  enum?: string[]
  properties?: Record<string, ToolParameter>
  items?: ToolParameter
  required?: string[]
}

export interface Tool {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, ToolParameter>
    required?: string[]
  }
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
}

export interface LLMResponse {
  content: string
  toolCalls: ToolCall[]
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence'
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

// =============================================================================
// STREAMING TYPES
// =============================================================================

export interface StreamChunk {
  type: 'text' | 'tool_use_start' | 'tool_use_input' | 'done' | 'error'
  text?: string
  toolCall?: Partial<ToolCall>
  error?: string
}

export type StreamCallback = (chunk: StreamChunk) => void

// =============================================================================
// REQUEST OPTIONS
// =============================================================================

export interface ChatOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
  tools?: Tool[]
  stream?: boolean
  onStream?: StreamCallback
}

export interface VisionOptions {
  model?: string
  maxTokens?: number
}

// =============================================================================
// PROVIDER CONFIG
// =============================================================================

export type LLMProviderType = 'anthropic' | 'openai' | 'google'

export interface LLMConfig {
  provider: LLMProviderType
  apiKey: string
  defaultModel?: string
}
