import { createClient } from '@/lib/supabase/server'
import { syncGmailEmails, checkExpiryNotifications } from '@/lib/gmail'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60 // Allow up to 60 seconds for sync

// POST /api/gmail/sync - Manual sync trigger
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Run Gmail sync
    const result = await syncGmailEmails(user.id)

    // Also check for expiry notifications
    await checkExpiryNotifications(user.id)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    )
  }
}

// GET /api/gmail/sync - Get sync status
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: connection } = await supabase
      .from('email_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'gmail')
      .single()

    if (!connection) {
      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({
      connected: true,
      email_address: connection.email_address,
      last_sync_at: connection.last_sync_at,
      sync_enabled: connection.sync_enabled,
    })
  } catch (error: any) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

