import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { CaseEventType } from '@/lib/types'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/cases/[id]/events - Get all events for a case
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify case belongs to user
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Get events
    const { data: events, error } = await supabase
      .from('case_events')
      .select('*')
      .eq('case_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(events || [])
  } catch (error) {
    console.error('Events API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/cases/[id]/events - Add a new event to a case
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify case belongs to user
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const body = await request.json()

    // Validate event type
    const validEventTypes: CaseEventType[] = [
      'created',
      'message_sent',
      'message_received',
      'status_change',
      'escalation',
      'follow_up_sent',
      'note',
      'attachment_added',
      'resolved',
    ]

    if (!body.event_type || !validEventTypes.includes(body.event_type)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      )
    }

    // Insert the event
    const { data: newEvent, error: insertError } = await supabase
      .from('case_events')
      .insert({
        case_id: id,
        user_id: user.id,
        event_type: body.event_type,
        content: body.content || null,
        old_status: body.old_status || null,
        new_status: body.new_status || null,
        attachment_path: body.attachment_path || null,
        attachment_name: body.attachment_name || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating event:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // If this is a message_sent event, update case status to 'sent' if it was 'draft'
    if (body.event_type === 'message_sent' && caseData.status === 'draft') {
      await supabase
        .from('cases')
        .update({ status: 'sent' })
        .eq('id', id)
    }

    // If this is a message_sent event, update status to 'waiting' if it was 'sent'
    if (body.event_type === 'message_sent' && caseData.status === 'sent') {
      await supabase
        .from('cases')
        .update({ status: 'waiting' })
        .eq('id', id)
    }

    return NextResponse.json(newEvent, { status: 201 })
  } catch (error) {
    console.error('Events API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
