/**
 * OpenAI GPT Provider (Stub)
 *
 * Implementation of LLM provider for OpenAI's GPT models.
 * Supports GPT-4, GPT-4 Turbo, GPT-4o, etc.
 *
 * TODO: Install openai package and implement fully when needed
 * npm install openai
 */

import { BaseLLMProvider } from './provider'
import type {
  Message,
  Tool,
  LLMResponse,
  ChatOptions,
  VisionOptions,
  LLMConfig,
} from './types'

export class OpenAIProvider extends BaseLLMProvider {
  readonly name = 'openai'

  constructor(config: LLMConfig) {
    super(config)
  }

  getDefaultModel(): string {
    return this.config.defaultModel || 'gpt-4o'
  }

  /**
   * Convert our unified tool format to OpenAI's function calling format
   */
  convertTools(tools: Tool[]): unknown[] {
    return tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters.properties,
          required: tool.parameters.required,
        },
      },
    }))
  }

  /**
   * Send a chat message and get a response
   *
   * TODO: Implement with OpenAI SDK
   * Example implementation:
   *
   * const openai = new OpenAI({ apiKey: this.config.apiKey })
   * const response = await openai.chat.completions.create({
   *   model: options?.model || this.getDefaultModel(),
   *   messages: this.convertMessages(messages),
   *   tools: options?.tools ? this.convertTools(options.tools) : undefined,
   *   max_tokens: options?.maxTokens,
   *   temperature: options?.temperature,
   * })
   */
  async chat(messages: Message[], options?: ChatOptions): Promise<LLMResponse> {
    throw new Error(
      'OpenAI provider not implemented. Install openai package and implement this method.\n' +
      'Run: npm install openai\n' +
      'Then implement the chat method using OpenAI SDK.'
    )
  }

  /**
   * Analyze an image with a prompt
   *
   * TODO: Implement with OpenAI Vision API
   * Example implementation:
   *
   * const response = await openai.chat.completions.create({
   *   model: 'gpt-4o',
   *   messages: [{
   *     role: 'user',
   *     content: [
   *       { type: 'image_url', image_url: { url: `data:${mediaType};base64,${imageData}` } },
   *       { type: 'text', text: prompt }
   *     ]
   *   }]
   * })
   */
  async vision(
    imageData: string,
    mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
    prompt: string,
    options?: VisionOptions
  ): Promise<string> {
    throw new Error(
      'OpenAI vision not implemented. Install openai package and implement this method.'
    )
  }
}

/**
 * Create an OpenAI provider instance
 */
export function createOpenAIProvider(apiKey?: string): OpenAIProvider {
  return new OpenAIProvider({
    provider: 'openai',
    apiKey: apiKey || process.env.OPENAI_API_KEY || '',
  })
}
