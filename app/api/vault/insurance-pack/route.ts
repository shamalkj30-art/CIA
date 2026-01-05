import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateInsurancePack } from '@/lib/insurance-pack-generator'
import type { InsuranceRoom, VaultItem } from '@/lib/types'

// POST /api/vault/insurance-pack - Generate an insurance pack
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { pack_name, rooms = [] } = body as {
      pack_name: string
      rooms?: InsuranceRoom[]
    }

    if (!pack_name) {
      return NextResponse.json({ error: 'Pack name is required' }, { status: 400 })
    }

    // Get all insurance items (optionally filtered by rooms)
    let query = supabase
      .from('vault_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('library', 'insurance')

    if (rooms.length > 0) {
      query = query.in('room', rooms)
    }

    const { data: items, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No insurance documents found for the selected criteria' },
        { status: 400 }
      )
    }

    // Download all files from storage
    const fileBuffers = new Map<string, ArrayBuffer>()

    for (const item of items) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('receipts')
        .download(item.storage_path)

      if (downloadError) {
        console.error(`Failed to download ${item.storage_path}:`, downloadError)
        continue // Skip files that fail to download
      }

      const arrayBuffer = await fileData.arrayBuffer()
      fileBuffers.set(item.storage_path, arrayBuffer)
    }

    // Generate the pack
    const result = await generateInsurancePack({
      packName: pack_name,
      rooms,
      items: items as VaultItem[],
      fileBuffers,
    })

    // Upload the ZIP to storage
    const timestamp = Date.now()
    const zipFileName = `${pack_name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.zip`
    const zipStoragePath = `${user.id}/insurance-packs/${zipFileName}`

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(zipStoragePath, result.zipBuffer, {
        contentType: 'application/zip',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Failed to save pack: ${uploadError.message}` }, { status: 500 })
    }

    // Create the pack record
    const { data: pack, error: insertError } = await supabase
      .from('insurance_packs')
      .insert({
        user_id: user.id,
        pack_name,
        room: rooms.length === 1 ? rooms[0] : null,
        rooms_included: rooms,
        zip_path: zipStoragePath,
        document_count: result.documentCount,
        total_value: result.totalValue,
        status: 'generated',
      })
      .select()
      .single()

    if (insertError) {
      // Clean up the uploaded ZIP if record creation fails
      await supabase.storage.from('receipts').remove([zipStoragePath])
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Generate signed URL for download
    const { data: signedUrlData } = await supabase.storage
      .from('receipts')
      .createSignedUrl(zipStoragePath, 3600, {
        download: zipFileName,
      })

    return NextResponse.json({
      ...pack,
      download_url: signedUrlData?.signedUrl,
    }, { status: 201 })
  } catch (err) {
    console.error('Insurance pack generation error:', err)
    return NextResponse.json({ error: 'Failed to generate pack' }, { status: 500 })
  }
}

// GET /api/vault/insurance-pack - List all generated packs
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('insurance_packs')
    .select('*')
    .eq('user_id', user.id)
    .order('generated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
