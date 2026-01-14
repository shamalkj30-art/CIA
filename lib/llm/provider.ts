/**
 * LLM Provider Interface
 *
 * All LLM providers must implement this interface.
 * This allows easy switching between Anthropic, OpenAI, Google, etc.
 */

import type {
  Message,
  Tool,
  LLMResponse,
  ChatOptions,
  VisionOptions,
  LLMConfig,
} from './types'

export interface LLMProvider {
  /**
   * Provider name for identification
   */
  readonly name: string

  /**
   * Send a chat message and get a response
   * Supports tool calling and multi-turn conversations
   */
  chat(messages: Message[], options?: ChatOptions): Promise<LLMResponse>

  /**
   * Analyze an image with a prompt
   * Used for receipt analysis, document reading, etc.
   */
  vision(
    imageData: string,
    mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
    prompt: string,
    options?: VisionOptions
  ): Promise<string>

  /**
   * Convert our unified tool format to provider-specific format
   */
  convertTools(tools: Tool[]): unknown[]

  /**
   * Get the default model for this provider
   */
  getDefaultModel(): string

  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean
}

/**
 * Base class with common functionality
 */
export abstract class BaseLLMProvider implements LLMProvider {
  protected config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
  }

  abstract readonly name: string
  abstract chat(messages: Message[], options?: ChatOptions): Promise<LLMResponse>
  abstract vision(
    imageData: string,
    mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
    prompt: string,
    options?: VisionOptions
  ): Promise<string>
  abstract convertTools(tools: Tool[]): unknown[]
  abstract getDefaultModel(): string

  isConfigured(): boolean {
    return Boolean(this.config.apiKey)
  }
}
