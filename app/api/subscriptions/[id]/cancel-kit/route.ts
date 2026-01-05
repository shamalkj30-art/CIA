import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { searchCancellationInfo } from '@/lib/cancel-kit-ai'
import type { CancelKit, CancelStep, Subscription, CancelGuide } from '@/lib/types'

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
  const merchantNormalized = sub.merchant.toLowerCase().trim()

  // Check cache first
  const { data: cachedGuide } = await supabase
    .from('cancel_guides')
    .select('*')
    .eq('merchant_normalized', merchantNormalized)
    .single()

  let steps: CancelStep[]
  let cancel_url = sub.cancel_url
  let support_email = sub.support_email
  let support_phone = sub.support_phone
  let verified_at: string
  let source: 'web_search' | 'cached' | 'ai_generated'
  let confidence: 'high' | 'medium' | 'low'

  const guide = cachedGuide as CancelGuide | null
  const isExpired = guide ? new Date(guide.expires_at) < new Date() : true

  if (guide && !isExpired) {
    // Use cached guide
    steps = guide.steps as CancelStep[]
    cancel_url = cancel_url || guide.cancel_url
    support_email = support_email || guide.support_email
    support_phone = support_phone || guide.support_phone
    verified_at = guide.verified_at
    source = 'cached'
    confidence = guide.confidence
  } else {
    // Fetch fresh data using smart AI
    const result = await searchCancellationInfo(sub.merchant)

    steps = result.steps
    cancel_url = cancel_url || result.cancel_url
    support_email = support_email || result.support_email
    support_phone = support_phone || result.support_phone
    verified_at = result.verified_at
    source = result.source
    confidence = result.confidence

    // Cache the result
    await supabase
      .from('cancel_guides')
      .upsert({
        merchant: sub.merchant,
        merchant_normalized: merchantNormalized,
        steps: steps,
        cancel_url: result.cancel_url,
        support_email: result.support_email,
        support_phone: result.support_phone,
        source: result.source,
        confidence: result.confidence,
        verified_at: result.verified_at,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      }, {
        onConflict: 'merchant',
      })
  }

  // Generate cancellation message draft
  const draft_message = generateCancelMessage(sub)

  const cancelKit: CancelKit = {
    subscription: sub,
    steps,
    draft_message,
    merchant_contact: {
      email: support_email,
      phone: support_phone,
      cancel_url,
    },
    verified_at,
    source,
    confidence,
  }

  return NextResponse.json(cancelKit)
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
