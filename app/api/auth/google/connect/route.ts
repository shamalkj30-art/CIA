import { createClient } from '@/lib/supabase/server'
import { getAuthUrl } from '@/lib/gmail'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check if user is authenticated
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
    }

    // Create a state token with user ID (for security)
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
    })).toString('base64')

    // Get Google OAuth URL
    const authUrl = getAuthUrl(state)

    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('Google connect error:', error)
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent('Failed to connect to Google')}`, 
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    )
  }
}

