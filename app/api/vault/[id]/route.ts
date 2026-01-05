import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/vault/[id] - Get single vault item
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
    .from('vault_items')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Vault item not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

// PATCH /api/vault/[id] - Update vault item
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
    const {
      library,
      title,
      room,
      tags,
      purchase_id,
      estimated_value,
      currency,
      expires_at,
      notes,
    } = body

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (library !== undefined) updateData.library = library
    if (title !== undefined) updateData.title = title
    if (room !== undefined) updateData.room = room
    if (tags !== undefined) updateData.tags = tags
    if (purchase_id !== undefined) updateData.purchase_id = purchase_id
    if (estimated_value !== undefined) updateData.estimated_value = estimated_value
    if (currency !== undefined) updateData.currency = currency
    if (expires_at !== undefined) updateData.expires_at = expires_at
    if (notes !== undefined) updateData.notes = notes

    const { data, error } = await supabase
      .from('vault_items')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// DELETE /api/vault/[id] - Delete vault item and storage object
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

  // First get the vault item to get the storage path
  const { data: vaultItem } = await supabase
    .from('vault_items')
    .select('storage_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!vaultItem) {
    return NextResponse.json({ error: 'Vault item not found' }, { status: 404 })
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('receipts')
    .remove([vaultItem.storage_path])

  if (storageError) {
    console.error('Error deleting storage object:', storageError)
    // Continue with deletion even if storage cleanup fails
  }

  // Delete the record
  const { error: deleteError } = await supabase
    .from('vault_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
