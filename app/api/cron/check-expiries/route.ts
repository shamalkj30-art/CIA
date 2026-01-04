import { createClient } from '@supabase/supabase-js'
import { checkExpiryNotifications, syncGmailEmails } from '@/lib/gmail'
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

// This endpoint should be called by a cron job (e.g., Vercel Cron, or external service)
// POST /api/cron/check-expiries
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Get all users with email connections
    const { data: connections } = await supabase
      .from('email_connections')
      .select('user_id')
      .eq('sync_enabled', true)

    const results = {
      users_processed: 0,
      notifications_created: 0,
      syncs_completed: 0,
      errors: [] as string[],
    }

    // Process each user
    for (const conn of connections || []) {
      try {
        // Sync Gmail
        const syncResult = await syncGmailEmails(conn.user_id)
        results.syncs_completed += syncResult.synced

        // Check expiries
        const expiryResult = await checkExpiryNotifications(conn.user_id)
        results.notifications_created += expiryResult?.created || 0

        results.users_processed++
      } catch (error: any) {
        console.error(`Error processing user ${conn.user_id}:`, error)
        results.errors.push(`User ${conn.user_id}: ${error.message}`)
      }
    }

    // Also check expiries for users without email connections
    const { data: allUsers } = await supabase.auth.admin.listUsers()
    
    for (const user of allUsers?.users || []) {
      // Skip users already processed
      if (connections?.some(c => c.user_id === user.id)) continue

      try {
        const expiryResult = await checkExpiryNotifications(user.id)
        results.notifications_created += expiryResult?.created || 0
      } catch (error: any) {
        // Silently skip errors for users without notification settings
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    endpoint: 'check-expiries',
    description: 'Cron job to sync Gmail and check warranty/return expiries'
  })
}

