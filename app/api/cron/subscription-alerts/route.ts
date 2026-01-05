import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// Alert type to display text mapping
const alertTypeLabels: Record<string, string> = {
  '7_day': 'in 7 days',
  '3_day': 'in 3 days',
  '1_day': 'tomorrow',
  'day_of': 'today',
}

// This endpoint should be called by a cron job daily
// POST /api/cron/subscription-alerts
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const today = new Date().toISOString().split('T')[0]

    const results = {
      alerts_processed: 0,
      notifications_created: 0,
      errors: [] as string[],
    }

    // Get all pending alerts for today
    const { data: pendingAlerts, error: alertsError } = await supabase
      .from('subscription_alerts')
      .select(`
        *,
        subscription:subscriptions(*)
      `)
      .eq('alert_date', today)
      .eq('sent', false)

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError)
      return NextResponse.json({ error: alertsError.message }, { status: 500 })
    }

    for (const alert of pendingAlerts || []) {
      try {
        const subscription = alert.subscription
        if (!subscription || subscription.status !== 'active') {
          // Mark as sent but don't create notification (subscription inactive)
          await supabase
            .from('subscription_alerts')
            .update({ sent: true, sent_at: new Date().toISOString() })
            .eq('id', alert.id)
          continue
        }

        // Check user's notification settings
        const { data: settings } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', alert.user_id)
          .single()

        // Check if this alert type is enabled
        const settingKey = `subscription_charge_${alert.alert_type}` as const
        const isEnabled = settings?.[settingKey] ?? true // Default to enabled

        if (!isEnabled) {
          // User has this alert type disabled
          await supabase
            .from('subscription_alerts')
            .update({ sent: true, sent_at: new Date().toISOString() })
            .eq('id', alert.id)
          continue
        }

        // Only send notification for confirmed renewal dates
        // For "tomorrow" and "day_of" alerts, only send if renewal_confidence is 'confirmed' or 'user_confirmed'
        const isHighConfidence = subscription.renewal_confidence === 'confirmed'
        const isCertainAlert = alert.alert_type === '1_day' || alert.alert_type === 'day_of'

        if (isCertainAlert && !isHighConfidence) {
          // Skip certainty alerts for unconfirmed dates
          await supabase
            .from('subscription_alerts')
            .update({ sent: true, sent_at: new Date().toISOString() })
            .eq('id', alert.id)
          continue
        }

        // Format the notification message
        const alertLabel = alertTypeLabels[alert.alert_type] || `in ${alert.alert_type.replace('_', ' ')}`
        const amount = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: subscription.currency || 'NOK',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(subscription.price)

        let title: string
        let message: string

        if (alert.alert_type === '1_day') {
          // Special "tomorrow" message
          title = `${subscription.merchant} charges tomorrow`
          message = `${subscription.merchant} will charge ${amount} tomorrow. Tap to view or cancel.`
        } else if (alert.alert_type === 'day_of') {
          title = `${subscription.merchant} charges today`
          message = `${subscription.merchant} is charging ${amount} today.`
        } else {
          title = `${subscription.merchant} renews ${alertLabel}`
          message = `${subscription.merchant}${subscription.plan_name ? ` (${subscription.plan_name})` : ''} will charge ${amount} ${alertLabel}.`
        }

        // Add confidence caveat for estimated dates
        if (!isHighConfidence && !isCertainAlert) {
          message += ' (Estimated date - confirm for accurate alerts)'
        }

        // Create notification
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: alert.user_id,
          type: 'subscription_charge',
          title,
          message,
          action_url: `/subscriptions`,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 7 days
        })

        if (notifError) {
          console.error('Error creating notification:', notifError)
          results.errors.push(`Alert ${alert.id}: ${notifError.message}`)
          continue
        }

        // Mark alert as sent
        await supabase
          .from('subscription_alerts')
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq('id', alert.id)

        results.notifications_created++
        results.alerts_processed++
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Error processing alert ${alert.id}:`, error)
        results.errors.push(`Alert ${alert.id}: ${errorMessage}`)
      }
    }

    return NextResponse.json({
      success: true,
      date: today,
      ...results,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Subscription alerts cron error:', error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'subscription-alerts',
    description: 'Daily cron job to send subscription charge notifications ("Netflix charges tomorrow")',
  })
}
