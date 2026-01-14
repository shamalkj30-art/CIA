import { getLLMProvider } from '@/lib/llm'
import type { CancelStep } from './types'

export interface SmartCancelResult {
  steps: CancelStep[]
  cancel_url: string | null
  support_email: string | null
  support_phone: string | null
  verified_at: string
  source: 'web_search' | 'cached' | 'ai_generated'
  confidence: 'high' | 'medium' | 'low'
}

export interface ServiceLookupResult {
  cancel_url: string | null
  support_url: string | null
  support_email: string | null
  support_phone: string | null
  verified_at: string
  source: 'web_search' | 'cached'
  confidence: 'high' | 'medium' | 'low'
}

// Search for cancellation info using LLM
export async function searchCancellationInfo(merchant: string): Promise<SmartCancelResult> {
  const currentYear = new Date().getFullYear()
  const llm = getLLMProvider()

  try {
    // Use LLM to find current cancellation procedures
    const prompt = `Search the web and find the current, up-to-date steps to cancel a ${merchant} subscription in ${currentYear}.

I need:
1. The exact URL where users can cancel their subscription (the direct cancellation page, not just the homepage)
2. Step-by-step instructions for canceling
3. Contact information (support email, phone) if available
4. Any special requirements (e.g., must call to cancel, chat-only, etc.)

Please search for "${merchant} cancel subscription ${currentYear}" and related queries.

Return your findings as JSON in this exact format:
{
  "cancel_url": "https://...",
  "steps": [
    {
      "step_number": 1,
      "title": "Short title",
      "description": "Detailed description of what to do",
      "action_type": "navigate|click|call|email|wait",
      "action_url": "optional URL for this step"
    }
  ],
  "support_email": "email or null",
  "support_phone": "phone or null",
  "special_requirements": "any special notes",
  "confidence": "high|medium|low"
}

Only return the JSON, no other text.`

    const response = await llm.chat(
      [{ role: 'user', content: prompt }],
      { maxTokens: 2048 }
    )

    if (response.content) {
      // Extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0])

        // Verify the cancel URL if provided
        let verifiedCancelUrl = data.cancel_url
        if (verifiedCancelUrl) {
          verifiedCancelUrl = await verifyUrl(verifiedCancelUrl)
        }

        return {
          steps: data.steps || generateFallbackSteps(merchant),
          cancel_url: verifiedCancelUrl,
          support_email: data.support_email || null,
          support_phone: data.support_phone || null,
          verified_at: new Date().toISOString(),
          source: 'web_search',
          confidence: data.confidence || 'medium',
        }
      }
    }
  } catch (error) {
    console.error('Error searching cancellation info:', error)
  }

  // Fallback to AI-generated generic steps
  return {
    steps: generateFallbackSteps(merchant),
    cancel_url: null,
    support_email: null,
    support_phone: null,
    verified_at: new Date().toISOString(),
    source: 'ai_generated',
    confidence: 'low',
  }
}

// Quick lookup for cancel URL only (for auto-fill in Add Subscription modal)
export async function lookupServiceInfo(merchant: string): Promise<ServiceLookupResult> {
  const llm = getLLMProvider()

  try {
    const prompt = `Search the web and find the official cancellation/account management URL for ${merchant}.

Search for "${merchant} cancel subscription" or "${merchant} manage subscription".

Return ONLY a JSON object with these fields:
{
  "cancel_url": "direct URL to cancel page or account settings",
  "support_url": "help/support page URL",
  "support_email": "official support email or null",
  "support_phone": "official support phone or null",
  "confidence": "high if found official page, medium if general account page, low if guessed"
}

Only return the JSON, no other text. If you can't find reliable info, set confidence to "low".`

    const response = await llm.chat(
      [{ role: 'user', content: prompt }],
      { maxTokens: 1024 }
    )

    if (response.content) {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0])

        // Verify URLs
        let verifiedCancelUrl = data.cancel_url
        if (verifiedCancelUrl) {
          verifiedCancelUrl = await verifyUrl(verifiedCancelUrl)
        }

        return {
          cancel_url: verifiedCancelUrl,
          support_url: data.support_url || null,
          support_email: data.support_email || null,
          support_phone: data.support_phone || null,
          verified_at: new Date().toISOString(),
          source: 'web_search',
          confidence: data.confidence || 'medium',
        }
      }
    }
  } catch (error) {
    console.error('Error looking up service info:', error)
  }

  return {
    cancel_url: null,
    support_url: null,
    support_email: null,
    support_phone: null,
    verified_at: new Date().toISOString(),
    source: 'web_search',
    confidence: 'low',
  }
}

// Verify URL is reachable and follow redirects
async function verifyUrl(url: string): Promise<string | null> {
  try {
    // Validate URL format first
    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null
    }

    // Make HEAD request to verify URL is reachable
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CyncroBot/1.0)',
      },
    })

    clearTimeout(timeout)

    if (response.ok || response.status === 405) {
      // Return the final URL after redirects
      return response.url || url
    }

    return null
  } catch {
    // URL verification failed, but still return the URL
    // (it might work in a browser even if our request failed)
    return url
  }
}

// Generate fallback steps when web search fails
function generateFallbackSteps(merchant: string): CancelStep[] {
  return [
    {
      step_number: 1,
      title: 'Log in to your account',
      description: `Go to ${merchant}'s website and sign in to your account`,
      action_type: 'navigate',
    },
    {
      step_number: 2,
      title: 'Find subscription settings',
      description: 'Look for "Account", "Settings", "Subscription", or "Billing" in the menu',
      action_type: 'navigate',
    },
    {
      step_number: 3,
      title: 'Cancel subscription',
      description: 'Click "Cancel subscription", "End membership", or similar option and follow the prompts',
      action_type: 'click',
    },
    {
      step_number: 4,
      title: 'Confirm cancellation',
      description: 'Check your email for confirmation. Save it as proof of cancellation.',
      action_type: 'wait',
    },
  ]
}

// Format relative time for "Last verified" display
export function formatVerifiedTime(verifiedAt: string): string {
  const verified = new Date(verifiedAt)
  const now = new Date()
  const diffMs = now.getTime() - verified.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) {
    return 'Just now'
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  } else {
    return verified.toLocaleDateString()
  }
}
