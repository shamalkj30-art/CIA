import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { lookupServiceInfo } from '@/lib/cancel-kit-ai'
import type { CancelGuide, ServiceLookupResult } from '@/lib/types'

// Lookup service info for auto-fill in Add Subscription modal
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get merchant name from query params
  const searchParams = request.nextUrl.searchParams
  const merchant = searchParams.get('merchant')

  if (!merchant || merchant.trim().length < 2) {
    return NextResponse.json({ error: 'Merchant name required (min 2 characters)' }, { status: 400 })
  }

  const merchantNormalized = merchant.toLowerCase().trim()

  // Check cache first
  const { data: cachedGuide } = await supabase
    .from('cancel_guides')
    .select('*')
    .eq('merchant_normalized', merchantNormalized)
    .single()

  const guide = cachedGuide as CancelGuide | null
  const isExpired = guide ? new Date(guide.expires_at) < new Date() : true

  if (guide && !isExpired) {
    // Return cached data
    const result: ServiceLookupResult = {
      cancel_url: guide.cancel_url,
      support_url: guide.support_url,
      support_email: guide.support_email,
      support_phone: guide.support_phone,
      verified_at: guide.verified_at,
      source: 'cached',
      confidence: guide.confidence,
    }
    return NextResponse.json(result)
  }

  // Fetch fresh data using smart AI
  const result = await lookupServiceInfo(merchant)

  // Cache the result if we got useful data
  if (result.cancel_url || result.support_email) {
    await supabase
      .from('cancel_guides')
      .upsert({
        merchant: merchant,
        merchant_normalized: merchantNormalized,
        steps: [], // Will be populated when full cancel kit is requested
        cancel_url: result.cancel_url,
        support_url: result.support_url,
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

  return NextResponse.json(result)
}
