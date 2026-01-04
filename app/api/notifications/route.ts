import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data: notifications, error: fetchError } = await query

    if (fetchError) {
      throw fetchError
    }

    // Get unread count
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    return NextResponse.json({
      notifications: notifications || [],
      unread_count: count || 0,
    })
  } catch (error: any) {
    console.error('Fetch notifications error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notification_ids, mark_all } = body

    if (mark_all) {
      // Mark all as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)
    } else if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .in('id', notification_ids)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update notifications error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const notificationId = searchParams.get('id')
    const deleteAll = searchParams.get('all') === 'true'

    if (deleteAll) {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
    } else if (notificationId) {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('id', notificationId)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete notifications error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

