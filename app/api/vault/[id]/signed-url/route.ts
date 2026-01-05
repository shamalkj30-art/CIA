import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/vault/[id]/signed-url - Get a signed URL for downloading the vault item
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

  // Get the vault item
  const { data: vaultItem, error: fetchError } = await supabase
    .from('vault_items')
    .select('storage_path, file_name')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !vaultItem) {
    return NextResponse.json({ error: 'Vault item not found' }, { status: 404 })
  }

  // Generate signed URL (valid for 1 hour)
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('receipts')
    .createSignedUrl(vaultItem.storage_path, 3600, {
      download: vaultItem.file_name, // Forces download with original filename
    })

  if (signedUrlError) {
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
  }

  return NextResponse.json({
    url: signedUrlData.signedUrl,
    file_name: vaultItem.file_name,
  })
}
