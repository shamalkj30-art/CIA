/**
 * Anthropic Claude Provider
 *
 * Implementation of LLM provider for Anthropic's Claude models.
 * Supports Claude 3.5 Sonnet, Claude 3 Opus, etc.
 */

import Anthropic from '@anthropic-ai/sdk'
import { BaseLLMProvider } from './provider'
import type {
  Message,
  Tool,
  LLMResponse,
  ChatOptions,
  VisionOptions,
  LLMConfig,
  ToolCall,
  MessageContent,
} from './types'

export class AnthropicProvider extends BaseLLMProvider {
  readonly name = 'anthropic'
  private client: Anthropic

  constructor(config: LLMConfig) {
    super(config)
    this.client = new Anthropic({
      apiKey: config.apiKey,
    })
  }

  getDefaultModel(): string {
    return this.config.defaultModel || 'claude-sonnet-4-5-20250929'
  }

  /**
   * Convert our unified tool format to Anthropic's format
   */
  convertTools(tools: Tool[]): Anthropic.Tool[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object' as const,
        properties: this.convertProperties(tool.parameters.properties),
        required: tool.parameters.required,
      },
    }))
  }

  private convertProperties(
    props: Record<string, unknown>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(props)) {
      result[key] = value
    }
    return result
  }

  /**
   * Convert our unified message format to Anthropic's format
   */
  private convertMessages(messages: Message[]): Anthropic.MessageParam[] {
    return messages
      .filter((m) => m.role !== 'system') // System is handled separately
      .map((message) => {
        if (typeof message.content === 'string') {
          return {
            role: message.role as 'user' | 'assistant',
            content: message.content,
          }
        }

        // Handle array content (multimodal)
        const contentBlocks: Anthropic.ContentBlockParam[] = []

        for (const block of message.content as MessageContent[]) {
          if (block.type === 'text') {
            contentBlocks.push({
              type: 'text',
              text: block.text,
            })
          } else if (block.type === 'image') {
            contentBlocks.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: block.source.mediaType,
                data: block.source.data,
              },
            })
          } else if (block.type === 'tool_use') {
            contentBlocks.push({
              type: 'tool_use',
              id: block.id,
              name: block.name,
              input: block.input,
            })
          } else if (block.type === 'tool_result') {
            contentBlocks.push({
              type: 'tool_result',
              tool_use_id: block.toolUseId,
              content: block.content,
            })
          }
        }

        return {
          role: message.role as 'user' | 'assistant',
          content: contentBlocks,
        }
      })
  }

  /**
   * Send a chat message and get a response
   */
  async chat(messages: Message[], options?: ChatOptions): Promise<LLMResponse> {
    const model = options?.model || this.getDefaultModel()
    const maxTokens = options?.maxTokens || 4096

    // Extract system prompt from messages or options
    const systemPrompt =
      options?.systemPrompt ||
      messages.find((m) => m.role === 'system')?.content

    const anthropicMessages = this.convertMessages(messages)
    const tools = options?.tools ? this.convertTools(options.tools) : undefined

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      system: typeof systemPrompt === 'string' ? systemPrompt : undefined,
      messages: anthropicMessages,
      tools,
      temperature: options?.temperature,
    })

    // Parse response
    let content = ''
    const toolCalls: ToolCall[] = []

    for (const block of response.content) {
      if (block.type === 'text') {
        content += block.text
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        })
      }
    }

    // Map stop reason
    let stopReason: LLMResponse['stopReason'] = 'end_turn'
    if (response.stop_reason === 'tool_use') {
      stopReason = 'tool_use'
    } else if (response.stop_reason === 'max_tokens') {
      stopReason = 'max_tokens'
    }

    return {
      content,
      toolCalls,
      stopReason,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    }
  }

  /**
   * Analyze an image with a prompt
   */
  async vision(
    imageData: string,
    mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
    prompt: string,
    options?: VisionOptions
  ): Promise<string> {
    const model = options?.model || this.getDefaultModel()
    const maxTokens = options?.maxTokens || 1024

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageData,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    })

    // Extract text from response
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    )

    return textBlock?.text || ''
  }
}

/**
 * Create an Anthropic provider instance
 */
export function createAnthropicProvider(apiKey?: string): AnthropicProvider {
  return new AnthropicProvider({
    provider: 'anthropic',
    apiKey: apiKey || process.env.ANTHROPIC_API_KEY || '',
  })
}
