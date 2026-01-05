import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { CancelKit, CancelStep, Subscription } from '@/lib/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Known cancellation info for popular services
const KNOWN_CANCEL_INFO: Record<string, { cancel_url?: string; steps: CancelStep[] }> = {
  netflix: {
    cancel_url: 'https://www.netflix.com/cancelplan',
    steps: [
      { step_number: 1, title: 'Go to Account', description: 'Sign in to Netflix and click your profile icon, then select "Account"', action_type: 'navigate', action_url: 'https://www.netflix.com/youraccount' },
      { step_number: 2, title: 'Cancel Membership', description: 'Click "Cancel Membership" under Membership & Billing', action_type: 'click' },
      { step_number: 3, title: 'Confirm Cancellation', description: 'Click "Finish Cancellation" to confirm. You can still watch until your billing period ends.', action_type: 'click' },
    ],
  },
  spotify: {
    cancel_url: 'https://www.spotify.com/account/subscription/',
    steps: [
      { step_number: 1, title: 'Go to Subscription', description: 'Log in to your Spotify account and go to your Subscription page', action_type: 'navigate', action_url: 'https://www.spotify.com/account/subscription/' },
      { step_number: 2, title: 'Change Plan', description: 'Click "Change plan" and then scroll down', action_type: 'click' },
      { step_number: 3, title: 'Cancel Premium', description: 'Click "Cancel Premium" at the bottom. Your premium continues until the billing period ends.', action_type: 'click' },
    ],
  },
  'amazon prime': {
    cancel_url: 'https://www.amazon.com/mc/pipelines/cancelPrime',
    steps: [
      { step_number: 1, title: 'Go to Prime Membership', description: 'Sign in to Amazon and go to your Prime Membership page', action_type: 'navigate', action_url: 'https://www.amazon.com/mc/pipelines/cancelPrime' },
      { step_number: 2, title: 'End Membership', description: 'Click "End membership and benefits"', action_type: 'click' },
      { step_number: 3, title: 'Confirm', description: 'Follow the prompts and confirm cancellation. Select refund option if eligible.', action_type: 'click' },
    ],
  },
  'disney+': {
    cancel_url: 'https://www.disneyplus.com/account/subscription',
    steps: [
      { step_number: 1, title: 'Go to Account', description: 'Log in to Disney+ and go to Account settings', action_type: 'navigate', action_url: 'https://www.disneyplus.com/account' },
      { step_number: 2, title: 'Select Subscription', description: 'Click on your subscription under "Subscription"', action_type: 'click' },
      { step_number: 3, title: 'Cancel Subscription', description: 'Click "Cancel Subscription" and follow the prompts to confirm', action_type: 'click' },
    ],
  },
  hbo: {
    cancel_url: 'https://www.max.com/account/subscription',
    steps: [
      { step_number: 1, title: 'Go to Settings', description: 'Log in to Max (formerly HBO Max) and go to Settings', action_type: 'navigate', action_url: 'https://www.max.com/settings' },
      { step_number: 2, title: 'Manage Subscription', description: 'Click "Subscription" under your account', action_type: 'click' },
      { step_number: 3, title: 'Cancel', description: 'Click "Cancel Subscription" and confirm your choice', action_type: 'click' },
    ],
  },
}

// Generate cancel kit for subscription
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get subscription
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !subscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  const sub = subscription as Subscription

  // Check if we have known cancel info for this merchant
  const merchantLower = sub.merchant.toLowerCase()
  const knownInfo = Object.entries(KNOWN_CANCEL_INFO).find(([key]) =>
    merchantLower.includes(key)
  )?.[1]

  let steps: CancelStep[]
  let cancel_url = sub.cancel_url

  if (knownInfo) {
    // Use known cancellation steps
    steps = knownInfo.steps
    cancel_url = cancel_url || knownInfo.cancel_url || null
  } else {
    // Generate generic steps with AI assistance
    steps = await generateCancelSteps(sub)
  }

  // Generate cancellation message draft
  const draft_message = generateCancelMessage(sub)

  const cancelKit: CancelKit = {
    subscription: sub,
    steps,
    draft_message,
    merchant_contact: {
      email: sub.support_email,
      phone: sub.support_phone,
      cancel_url,
    },
  }

  return NextResponse.json(cancelKit)
}

async function generateCancelSteps(subscription: Subscription): Promise<CancelStep[]> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate 3-4 generic steps for cancelling a subscription to "${subscription.merchant}"${subscription.plan_name ? ` (${subscription.plan_name} plan)` : ''}.

Return as a JSON array of steps with this structure:
[
  {
    "step_number": 1,
    "title": "Short title",
    "description": "Clear description of what to do",
    "action_type": "navigate|click|call|email|wait"
  }
]

Be concise and practical. If you don't know the specific process, provide generic subscription cancellation steps.`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type === 'text') {
      // Extract JSON from response
      const jsonMatch = content.text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    }
  } catch (error) {
    console.error('Error generating cancel steps:', error)
  }

  // Fallback generic steps
  return [
    {
      step_number: 1,
      title: 'Log in to your account',
      description: `Go to ${subscription.merchant}'s website and sign in to your account`,
      action_type: 'navigate',
    },
    {
      step_number: 2,
      title: 'Find subscription settings',
      description: 'Look for "Account", "Settings", or "Subscription" in the menu',
      action_type: 'navigate',
    },
    {
      step_number: 3,
      title: 'Cancel subscription',
      description: 'Click "Cancel subscription" or "End membership" and follow the prompts',
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

function generateCancelMessage(subscription: Subscription): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `Subject: Subscription Cancellation Request

Dear ${subscription.merchant} Support,

I am writing to request the cancellation of my subscription${subscription.plan_name ? ` (${subscription.plan_name})` : ''}.

Subscription Details:
- Service: ${subscription.merchant}${subscription.plan_name ? ` - ${subscription.plan_name}` : ''}
- Monthly/Annual Amount: ${subscription.currency} ${subscription.price}
${subscription.next_charge_date ? `- Next Billing Date: ${subscription.next_charge_date}` : ''}

Please process this cancellation request effective immediately and confirm:
1. The date my subscription will end
2. Any final charges or refunds
3. Written confirmation of this cancellation

Please respond to this email to confirm receipt and processing of my cancellation request.

Thank you for your assistance.

Best regards`
}
