import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/assistant/conversations - List conversations
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: conversations, error } = await supabase
      .from('assistant_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('List conversations error:', error)
    return NextResponse.json(
      { error: 'Failed to list conversations' },
      { status: 500 }
    )
  }
}

// POST /api/assistant/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, context } = body

    const { data: conversation, error } = await supabase
      .from('assistant_conversations')
      .insert({
        user_id: user.id,
        title: title || 'New conversation',
        started_page: context?.page || null,
        context_type: context?.itemType || 'global',
        context_id: context?.itemId || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error) {
    console.error('Create conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}
