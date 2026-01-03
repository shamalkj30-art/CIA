import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/purchases/[id]/signed-url - Get signed URL for receipt
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

  // Get document for this purchase
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('storage_path, file_type, file_name')
    .eq('purchase_id', id)
    .eq('user_id', user.id)
    .single()

  if (docError || !document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Generate signed URL (valid for 1 hour)
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('receipts')
    .createSignedUrl(document.storage_path, 3600)

  if (signedUrlError) {
    return NextResponse.json({ error: signedUrlError.message }, { status: 500 })
  }

  return NextResponse.json({
    url: signedUrlData.signedUrl,
    file_type: document.file_type,
    file_name: document.file_name,
  })
}

