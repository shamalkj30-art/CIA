import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/vault/insurance-pack/[id] - Get a specific pack with download URL
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

  const { data: pack, error } = await supabase
    .from('insurance_packs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !pack) {
    return NextResponse.json({ error: 'Pack not found' }, { status: 404 })
  }

  // Generate a fresh signed URL for download
  if (pack.zip_path) {
    const zipFileName = pack.zip_path.split('/').pop() || 'insurance-pack.zip'
    const { data: signedUrlData } = await supabase.storage
      .from('receipts')
      .createSignedUrl(pack.zip_path, 3600, {
        download: zipFileName,
      })

    return NextResponse.json({
      ...pack,
      download_url: signedUrlData?.signedUrl,
    })
  }

  return NextResponse.json(pack)
}

// DELETE /api/vault/insurance-pack/[id] - Delete a pack and its files
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

  // Get the pack to find storage paths
  const { data: pack } = await supabase
    .from('insurance_packs')
    .select('zip_path, pdf_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!pack) {
    return NextResponse.json({ error: 'Pack not found' }, { status: 404 })
  }

  // Delete storage files
  const pathsToDelete = [pack.zip_path, pack.pdf_path].filter(Boolean) as string[]
  if (pathsToDelete.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('receipts')
      .remove(pathsToDelete)

    if (storageError) {
      console.error('Error deleting pack files:', storageError)
    }
  }

  // Delete the record
  const { error: deleteError } = await supabase
    .from('insurance_packs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
