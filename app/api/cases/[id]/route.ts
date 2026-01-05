import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { UpdateCaseInput } from '@/lib/types'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/cases/[id] - Get a single case with events
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

    // Get case with related data
    const { data: caseData, error } = await supabase
      .from('cases')
      .select(`
        *,
        purchase:purchases(id, item_name, merchant, price, purchase_date, order_number),
        subscription:subscriptions(id, merchant, plan_name, price, cadence)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 })
      }
      console.error('Error fetching case:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get events for this case
    const { data: events } = await supabase
      .from('case_events')
      .select('*')
      .eq('case_id', id)
      .order('created_at', { ascending: true })

    // Get messages for this case
    const { data: messages } = await supabase
      .from('case_messages')
      .select('*')
      .eq('case_id', id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      ...caseData,
      events: events || [],
      messages: messages || [],
    })
  } catch (error) {
    console.error('Case API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/cases/[id] - Update a case
export async function PATCH(request: NextRequest, context: RouteContext) {
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

    const body: UpdateCaseInput = await request.json()

    // Check if case exists and belongs to user
    const { data: existingCase, error: fetchError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Build update object
    const updateData: Record<string, unknown> = {}

    if (body.case_type !== undefined) updateData.case_type = body.case_type
    if (body.status !== undefined) updateData.status = body.status
    if (body.subject !== undefined) updateData.subject = body.subject
    if (body.description !== undefined) updateData.description = body.description
    if (body.merchant !== undefined) updateData.merchant = body.merchant
    if (body.merchant_email !== undefined) updateData.merchant_email = body.merchant_email
    if (body.merchant_phone !== undefined) updateData.merchant_phone = body.merchant_phone
    if (body.reference_number !== undefined) updateData.reference_number = body.reference_number
    if (body.follow_up_at !== undefined) updateData.follow_up_at = body.follow_up_at
    if (body.escalation_at !== undefined) updateData.escalation_at = body.escalation_at
    if (body.auto_follow_up !== undefined) updateData.auto_follow_up = body.auto_follow_up
    if (body.resolution_notes !== undefined) updateData.resolution_notes = body.resolution_notes
    if (body.resolution_outcome !== undefined) updateData.resolution_outcome = body.resolution_outcome

    // If status changed to resolved, set resolved_at
    if (body.status === 'resolved' && existingCase.status !== 'resolved') {
      updateData.resolved_at = new Date().toISOString()

      // Create resolved event
      await supabase.from('case_events').insert({
        case_id: id,
        user_id: user.id,
        event_type: 'resolved',
        content: body.resolution_notes || 'Case resolved',
      })
    }

    // Update the case
    const { data: updatedCase, error: updateError } = await supabase
      .from('cases')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating case:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(updatedCase)
  } catch (error) {
    console.error('Case API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/cases/[id] - Delete a case
export async function DELETE(request: NextRequest, context: RouteContext) {
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

    // Delete the case (cascade will handle events and messages)
    const { error: deleteError } = await supabase
      .from('cases')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting case:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Case API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
