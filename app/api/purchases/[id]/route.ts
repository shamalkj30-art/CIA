import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/purchases/[id] - Get single purchase with documents
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('purchases')
    .select('*, documents(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

// PATCH /api/purchases/[id] - Update purchase
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { item_name, merchant, purchase_date, warranty_months, notes, category } = body

    // Calculate warranty expiration
    let warranty_expires_at = null
    if (purchase_date && warranty_months && warranty_months > 0) {
      const purchaseDate = new Date(purchase_date)
      purchaseDate.setMonth(purchaseDate.getMonth() + warranty_months)
      warranty_expires_at = purchaseDate.toISOString().split('T')[0]
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (item_name !== undefined) updateData.item_name = item_name
    if (merchant !== undefined) updateData.merchant = merchant
    if (purchase_date !== undefined) updateData.purchase_date = purchase_date
    if (warranty_months !== undefined) {
      updateData.warranty_months = warranty_months
      updateData.warranty_expires_at = warranty_expires_at
    }
    if (notes !== undefined) updateData.notes = notes
    if (category !== undefined) updateData.category = category

    const { data, error } = await supabase
      .from('purchases')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, documents(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// DELETE /api/purchases/[id] - Delete purchase and associated storage objects
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // First, get all documents for this purchase to delete from storage
  const { data: documents } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('purchase_id', id)
    .eq('user_id', user.id)

  // Get any packets too
  const { data: packets } = await supabase
    .from('packets')
    .select('storage_path')
    .eq('purchase_id', id)
    .eq('user_id', user.id)

  // Delete storage objects
  const storagePaths = [
    ...(documents?.map(d => d.storage_path) || []),
    ...(packets?.map(p => p.storage_path) || []),
  ]

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('receipts')
      .remove(storagePaths)

    if (storageError) {
      console.error('Error deleting storage objects:', storageError)
      // Continue with deletion even if storage cleanup fails
    }
  }

  // Delete purchase (cascades to documents and packets)
  const { error: deleteError } = await supabase
    .from('purchases')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
