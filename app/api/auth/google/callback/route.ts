import { createClient } from '@supabase/supabase-js'
import { getTokensFromCode, getUserEmail, syncGmailEmails } from '@/lib/gmail'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent('Google authorization was denied')}`, baseUrl)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/settings?error=Invalid+callback+parameters', baseUrl)
    )
  }

  try {
    // Decode state to get user ID
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    const { userId, timestamp } = stateData

    // Check if state is not too old (5 minutes max)
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      return NextResponse.redirect(
        new URL('/settings?error=Authorization+expired', baseUrl)
      )
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get tokens')
    }

    // Get user's Gmail address
    const emailAddress = await getUserEmail(tokens.access_token)

    if (!emailAddress) {
      throw new Error('Failed to get email address')
    }

    const supabase = getSupabaseAdmin()

    // Save or update email connection
    const { error: upsertError } = await supabase
      .from('email_connections')
      .upsert({
        user_id: userId,
        provider: 'gmail',
        email_address: emailAddress,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokens.expiry_date 
          ? new Date(tokens.expiry_date).toISOString() 
          : new Date(Date.now() + 3600 * 1000).toISOString(),
        sync_enabled: true,
        last_sync_at: null,
      }, {
        onConflict: 'user_id,provider',
      })

    if (upsertError) {
      console.error('Failed to save connection:', upsertError)
      throw new Error('Failed to save connection')
    }

    // Create success notification
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'gmail_connected',
      title: 'Gmail connected!',
      message: `Your Gmail account (${emailAddress}) is now connected. We'll automatically detect your orders.`,
      action_url: '/settings',
    })

    // Trigger initial sync in background
    syncGmailEmails(userId).catch(err => {
      console.error('Initial sync error:', err)
    })

    return NextResponse.redirect(
      new URL('/settings?success=Gmail+connected+successfully', baseUrl)
    )
  } catch (error: any) {
    console.error('Google callback error:', error)
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(error.message || 'Failed to connect Gmail')}`, baseUrl)
    )
  }
}

