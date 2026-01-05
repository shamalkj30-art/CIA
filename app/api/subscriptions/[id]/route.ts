import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { UpdateSubscriptionInput } from '@/lib/types'

// GET /api/subscriptions/[id] - Get single subscription
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

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  // Calculate days_until_charge
  let days_until_charge: number | null = null
  if (data.next_charge_date) {
    const nextCharge = new Date(data.next_charge_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    nextCharge.setHours(0, 0, 0, 0)
    days_until_charge = Math.ceil((nextCharge.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Get upcoming alerts
  const { data: alerts } = await supabase
    .from('subscription_alerts')
    .select('*')
    .eq('subscription_id', id)
    .eq('sent', false)
    .gte('alert_date', new Date().toISOString().split('T')[0])
    .order('alert_date', { ascending: true })

  return NextResponse.json({
    ...data,
    days_until_charge,
    upcoming_alerts: alerts || [],
  })
}

// PATCH /api/subscriptions/[id] - Update subscription
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: UpdateSubscriptionInput = await request.json()
    const {
      merchant,
      plan_name,
      logo_url,
      price,
      currency,
      cadence,
      next_charge_date,
      last_charge_date,
      renewal_confidence,
      status,
      cancel_url,
      support_email,
      support_phone,
      category,
      notes,
    } = body

    // Get old values for history tracking
    const { data: oldSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!oldSubscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (merchant !== undefined) updateData.merchant = merchant
    if (plan_name !== undefined) updateData.plan_name = plan_name
    if (logo_url !== undefined) updateData.logo_url = logo_url
    if (price !== undefined) updateData.price = price
    if (currency !== undefined) updateData.currency = currency
    if (cadence !== undefined) updateData.cadence = cadence
    if (next_charge_date !== undefined) updateData.next_charge_date = next_charge_date
    if (last_charge_date !== undefined) updateData.last_charge_date = last_charge_date
    if (renewal_confidence !== undefined) updateData.renewal_confidence = renewal_confidence
    if (status !== undefined) updateData.status = status
    if (cancel_url !== undefined) updateData.cancel_url = cancel_url
    if (support_email !== undefined) updateData.support_email = support_email
    if (support_phone !== undefined) updateData.support_phone = support_phone
    if (category !== undefined) updateData.category = category
    if (notes !== undefined) updateData.notes = notes

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Track price changes in history
    if (price !== undefined && price !== oldSubscription.price) {
      await supabase.from('subscription_history').insert({
        subscription_id: id,
        event_type: 'price_change',
        old_value: { price: oldSubscription.price },
        new_value: { price },
      })
    }

    // Track status changes
    if (status !== undefined && status !== oldSubscription.status) {
      const eventType = status === 'cancelled' ? 'cancelled' : status === 'active' && oldSubscription.status === 'cancelled' ? 'reactivated' : 'updated'
      await supabase.from('subscription_history').insert({
        subscription_id: id,
        event_type: eventType,
        old_value: { status: oldSubscription.status },
        new_value: { status },
      })
    }

    // Calculate days_until_charge
    let days_until_charge: number | null = null
    if (data.next_charge_date) {
      const nextCharge = new Date(data.next_charge_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      nextCharge.setHours(0, 0, 0, 0)
      days_until_charge = Math.ceil((nextCharge.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({ ...data, days_until_charge })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// DELETE /api/subscriptions/[id] - Delete subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Delete subscription (cascades to alerts and history via FK)
  const { error: deleteError } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
