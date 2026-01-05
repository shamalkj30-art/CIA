import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { CreateSubscriptionInput, Subscription } from '@/lib/types'

// GET /api/subscriptions - List all subscriptions with optional filters
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') // 'active', 'paused', 'cancelled', 'expired'
  const search = searchParams.get('search')

  let query = supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('next_charge_date', { ascending: true, nullsFirst: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`merchant.ilike.%${search}%,plan_name.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Calculate days_until_charge for each subscription
  const subscriptionsWithDays = (data as Subscription[]).map(sub => {
    let days_until_charge: number | null = null
    if (sub.next_charge_date) {
      const nextCharge = new Date(sub.next_charge_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      nextCharge.setHours(0, 0, 0, 0)
      days_until_charge = Math.ceil((nextCharge.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }
    return { ...sub, days_until_charge }
  })

  return NextResponse.json(subscriptionsWithDays)
}

// POST /api/subscriptions - Create a new subscription
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: CreateSubscriptionInput = await request.json()
    const {
      merchant,
      plan_name,
      logo_url,
      price,
      currency = 'NOK',
      cadence,
      next_charge_date,
      last_charge_date,
      renewal_confidence = 'estimated',
      status = 'active',
      cancel_url,
      support_email,
      support_phone,
      category,
      notes,
      source = 'manual',
    } = body

    // Validate required fields
    if (!merchant || !price || !cadence) {
      return NextResponse.json(
        { error: 'Merchant, price, and cadence are required' },
        { status: 400 }
      )
    }

    // Insert subscription
    const { data: subscription, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        merchant,
        plan_name: plan_name || null,
        logo_url: logo_url || null,
        price,
        currency,
        cadence,
        next_charge_date: next_charge_date || null,
        last_charge_date: last_charge_date || null,
        renewal_confidence,
        status,
        cancel_url: cancel_url || null,
        support_email: support_email || null,
        support_phone: support_phone || null,
        category: category || null,
        notes: notes || null,
        source,
        auto_detected: false,
        needs_review: false,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Calculate days_until_charge
    let days_until_charge: number | null = null
    if (subscription.next_charge_date) {
      const nextCharge = new Date(subscription.next_charge_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      nextCharge.setHours(0, 0, 0, 0)
      days_until_charge = Math.ceil((nextCharge.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({ ...subscription, days_until_charge }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
