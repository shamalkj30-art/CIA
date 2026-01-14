/**
 * LLM Abstraction Layer
 *
 * Provides a unified interface for different LLM providers.
 * Switch between Anthropic, OpenAI, or Google with a single config change.
 *
 * Usage:
 *   import { createLLMProvider, getLLMProvider } from '@/lib/llm'
 *
 *   // Create a provider explicitly
 *   const llm = createLLMProvider('anthropic')
 *
 *   // Or get the default provider based on env config
 *   const llm = getLLMProvider()
 *
 *   // Use the provider
 *   const response = await llm.chat(messages, { tools, systemPrompt })
 *   const analysis = await llm.vision(imageData, 'image/png', prompt)
 */

import type { LLMProviderType, LLMConfig, Tool } from './types'
import type { LLMProvider } from './provider'
import { AnthropicProvider, createAnthropicProvider } from './anthropic'
import { OpenAIProvider, createOpenAIProvider } from './openai'
import { GoogleProvider, createGoogleProvider } from './google'

// Re-export types for convenience
export * from './types'
export type { LLMProvider } from './provider'

// Re-export providers
export { AnthropicProvider, createAnthropicProvider } from './anthropic'
export { OpenAIProvider, createOpenAIProvider } from './openai'
export { GoogleProvider, createGoogleProvider } from './google'

/**
 * Create an LLM provider based on type
 */
export function createLLMProvider(
  type: LLMProviderType,
  apiKey?: string
): LLMProvider {
  switch (type) {
    case 'anthropic':
      return createAnthropicProvider(apiKey)
    case 'openai':
      return createOpenAIProvider(apiKey)
    case 'google':
      return createGoogleProvider(apiKey)
    default:
      throw new Error(`Unknown LLM provider type: ${type}`)
  }
}

/**
 * Get the default LLM provider based on environment config
 *
 * Set LLM_PROVIDER env var to switch providers:
 * - 'anthropic' (default) - Uses ANTHROPIC_API_KEY
 * - 'openai' - Uses OPENAI_API_KEY
 * - 'google' - Uses GOOGLE_AI_API_KEY
 */
export function getLLMProvider(): LLMProvider {
  const providerType =
    (process.env.LLM_PROVIDER as LLMProviderType) || 'anthropic'
  return createLLMProvider(providerType)
}

/**
 * Convert tool definitions from Anthropic format to unified format
 * This helps migrate existing code
 *
 * Accepts Anthropic SDK Tool[] type directly
 */
export function convertFromAnthropicTools(
  anthropicTools: Array<{
    name: string
    description?: string
    input_schema: {
      type: string
      properties?: unknown
      required?: string[] | null
    }
  }>
): Tool[] {
  return anthropicTools.map((tool) => ({
    name: tool.name,
    description: tool.description || '',
    parameters: {
      type: 'object' as const,
      properties: (tool.input_schema.properties || {}) as Record<string, Tool['parameters']['properties'][string]>,
      required: tool.input_schema.required ?? undefined,
    },
  }))
}

// Singleton instance for convenience
let defaultProvider: LLMProvider | null = null

/**
 * Get or create the default provider instance (singleton)
 */
export function getDefaultLLMProvider(): LLMProvider {
  if (!defaultProvider) {
    defaultProvider = getLLMProvider()
  }
  return defaultProvider
}

/**
 * Reset the default provider (useful for testing)
 */
export function resetDefaultProvider(): void {
  defaultProvider = null
}
