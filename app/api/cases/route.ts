import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { CreateCaseInput, Case } from '@/lib/types'

// GET /api/cases - List all cases for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query params for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const caseType = searchParams.get('type')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('cases')
      .select(`
        *,
        purchase:purchases(id, item_name, merchant),
        subscription:subscriptions(id, merchant, plan_name)
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (caseType && caseType !== 'all') {
      query = query.eq('case_type', caseType)
    }

    if (search) {
      query = query.or(`subject.ilike.%${search}%,merchant.ilike.%${search}%`)
    }

    const { data: cases, error } = await query

    if (error) {
      console.error('Error fetching cases:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate days until follow-up for each case
    const casesWithDays = (cases || []).map((c: Case & { purchase?: unknown; subscription?: unknown }) => {
      let daysUntilFollowUp: number | null = null
      if (c.follow_up_at) {
        const followUpDate = new Date(c.follow_up_at)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        followUpDate.setHours(0, 0, 0, 0)
        daysUntilFollowUp = Math.ceil(
          (followUpDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )
      }

      return {
        ...c,
        days_until_follow_up: daysUntilFollowUp,
      }
    })

    return NextResponse.json(casesWithDays)
  } catch (error) {
    console.error('Cases API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/cases - Create a new case
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateCaseInput = await request.json()

    // Validate required fields
    if (!body.case_type || !body.subject || !body.merchant) {
      return NextResponse.json(
        { error: 'Missing required fields: case_type, subject, merchant' },
        { status: 400 }
      )
    }

    // Insert the case
    const { data: newCase, error: insertError } = await supabase
      .from('cases')
      .insert({
        user_id: user.id,
        purchase_id: body.purchase_id || null,
        subscription_id: body.subscription_id || null,
        case_type: body.case_type,
        status: 'draft',
        subject: body.subject,
        description: body.description || null,
        merchant: body.merchant,
        merchant_email: body.merchant_email || null,
        merchant_phone: body.merchant_phone || null,
        auto_follow_up: body.auto_follow_up ?? true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating case:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Create initial "created" event
    await supabase.from('case_events').insert({
      case_id: newCase.id,
      user_id: user.id,
      event_type: 'created',
      content: `Case created: ${body.subject}`,
    })

    return NextResponse.json(newCase, { status: 201 })
  } catch (error) {
    console.error('Cases API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
