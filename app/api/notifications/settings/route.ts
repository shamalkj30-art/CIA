import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/notifications/settings - Get notification settings
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create settings
    let { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!settings) {
      // Create default settings
      const { data: newSettings, error: createError } = await supabase
        .from('notification_settings')
        .insert({
          user_id: user.id,
          warranty_expiring: true,
          warranty_expiring_days: 30,
          return_deadline: true,
          return_deadline_days: 3,
          new_purchase: true,
          email_notifications: false,
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }
      settings = newSettings
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Fetch settings error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications/settings - Update notification settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const allowedFields = [
      'warranty_expiring',
      'warranty_expiring_days',
      'return_deadline',
      'return_deadline_days',
      'new_purchase',
      'email_notifications',
    ]

    // Filter to only allowed fields
    const updates: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: settings, error: updateError } = await supabase
      .from('notification_settings')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      // If no row exists, create one
      if (updateError.code === 'PGRST116') {
        const { data: newSettings, error: createError } = await supabase
          .from('notification_settings')
          .insert({
            user_id: user.id,
            ...updates,
          })
          .select()
          .single()

        if (createError) throw createError
        return NextResponse.json(newSettings)
      }
      throw updateError
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

