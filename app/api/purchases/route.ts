import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/purchases - List all purchases with optional search
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get('search')

  let query = supabase
    .from('purchases')
    .select('*, documents(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('item_name', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/purchases - Create a new purchase
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { item_name, merchant, purchase_date, warranty_months, document } = body

    // Validate required fields
    if (!item_name || !purchase_date) {
      return NextResponse.json(
        { error: 'Item name and purchase date are required' },
        { status: 400 }
      )
    }

    // Insert purchase
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        item_name,
        merchant: merchant || null,
        purchase_date,
        warranty_months: warranty_months || 0,
      })
      .select()
      .single()

    if (purchaseError) {
      return NextResponse.json({ error: purchaseError.message }, { status: 500 })
    }

    // If document info provided, insert document record
    if (document) {
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          purchase_id: purchase.id,
          user_id: user.id,
          storage_path: document.storage_path,
          file_name: document.file_name,
          file_type: document.file_type,
          file_size: document.file_size,
        })

      if (docError) {
        // Rollback purchase if document insert fails
        await supabase.from('purchases').delete().eq('id', purchase.id)
        return NextResponse.json({ error: docError.message }, { status: 500 })
      }
    }

    // Fetch complete purchase with documents
    const { data: completePurchase } = await supabase
      .from('purchases')
      .select('*, documents(*)')
      .eq('id', purchase.id)
      .single()

    return NextResponse.json(completePurchase, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

