import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { VaultLibrary, InsuranceRoom } from '@/lib/types'

// GET /api/vault - List vault items with optional filters
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const library = searchParams.get('library') as VaultLibrary | null
  const room = searchParams.get('room') as InsuranceRoom | null
  const search = searchParams.get('search')
  const tags = searchParams.get('tags') // comma-separated
  const expiring = searchParams.get('expiring') // 'true' to filter items expiring in 30 days

  let query = supabase
    .from('vault_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (library) {
    query = query.eq('library', library)
  }

  if (room) {
    query = query.eq('room', room)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,notes.ilike.%${search}%,file_name.ilike.%${search}%`)
  }

  if (tags) {
    const tagArray = tags.split(',').map(t => t.trim())
    query = query.overlaps('tags', tagArray)
  }

  if (expiring === 'true') {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    query = query
      .not('expires_at', 'is', null)
      .lte('expires_at', thirtyDaysFromNow.toISOString().split('T')[0])
      .gte('expires_at', new Date().toISOString().split('T')[0])
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/vault - Upload a new vault item
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Handle multipart form data for file upload
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const library = formData.get('library') as VaultLibrary
    const title = formData.get('title') as string
    const room = formData.get('room') as InsuranceRoom | null
    const tagsStr = formData.get('tags') as string | null
    const purchaseId = formData.get('purchase_id') as string | null
    const estimatedValue = formData.get('estimated_value') as string | null
    const currency = (formData.get('currency') as string) || 'NOK'
    const expiresAt = formData.get('expires_at') as string | null
    const notes = formData.get('notes') as string | null

    // Validate required fields
    if (!file || !library || !title) {
      return NextResponse.json(
        { error: 'File, library, and title are required' },
        { status: 400 }
      )
    }

    // Parse tags
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : []

    // Upload file to storage
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `${user.id}/vault/${library}/${timestamp}_${sanitizedFileName}`

    const { error: uploadError } = await supabase.storage
      .from('receipts') // Using existing receipts bucket
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    // Create vault item record
    const { data: vaultItem, error: insertError } = await supabase
      .from('vault_items')
      .insert({
        user_id: user.id,
        library,
        title,
        storage_path: storagePath,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        room: room || null,
        tags,
        purchase_id: purchaseId || null,
        estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
        currency,
        expires_at: expiresAt || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (insertError) {
      // Clean up uploaded file if record creation fails
      await supabase.storage.from('receipts').remove([storagePath])
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(vaultItem, { status: 201 })
  } catch (err) {
    console.error('Vault upload error:', err)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
