import { createClient } from '@/lib/supabase/server'
import { generateClaimPacket } from '@/lib/pdf-generator'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/purchases/[id]/packet - Generate claim packet PDF
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get purchase with documents
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .select('*, documents(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (purchaseError || !purchase) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
  }

  // Prepare receipt data
  let receiptData = null
  const document = purchase.documents?.[0]

  if (document) {
    const isPdf = document.file_type === 'application/pdf'

    if (!isPdf) {
      // For images, fetch the file and convert to base64
      const { data: fileData, error: fileError } = await supabase.storage
        .from('receipts')
        .download(document.storage_path)

      if (!fileError && fileData) {
        const arrayBuffer = await fileData.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const dataUrl = `data:${document.file_type};base64,${base64}`

        receiptData = {
          imageDataUrl: dataUrl,
          file_type: document.file_type,
          file_name: document.file_name,
          isPdf: false,
        }
      }
    } else {
      // PDF receipt - can't embed, just note it
      receiptData = {
        imageDataUrl: null,
        file_type: document.file_type,
        file_name: document.file_name,
        isPdf: true,
      }
    }
  }

  // Generate PDF
  const pdfBytes = await generateClaimPacket(
    {
      item_name: purchase.item_name,
      merchant: purchase.merchant,
      purchase_date: purchase.purchase_date,
      warranty_months: purchase.warranty_months,
      warranty_expires_at: purchase.warranty_expires_at,
    },
    receiptData
  )

  // Save to storage
  const timestamp = Date.now()
  const sanitizedName = purchase.item_name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)
  const fileName = `claim_packet_${sanitizedName}_${timestamp}.pdf`
  const storagePath = `${user.id}/packets/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(storagePath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Save packet record to database
  const { data: packet, error: packetError } = await supabase
    .from('packets')
    .insert({
      purchase_id: id,
      user_id: user.id,
      storage_path: storagePath,
      file_name: fileName,
    })
    .select()
    .single()

  if (packetError) {
    // Clean up uploaded file
    await supabase.storage.from('receipts').remove([storagePath])
    return NextResponse.json({ error: packetError.message }, { status: 500 })
  }

  // Generate signed URL for download
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('receipts')
    .createSignedUrl(storagePath, 3600) // 1 hour

  if (signedUrlError) {
    return NextResponse.json({ error: signedUrlError.message }, { status: 500 })
  }

  return NextResponse.json({
    packet,
    download_url: signedUrlData.signedUrl,
  })
}

// GET /api/purchases/[id]/packet - Get latest packet for purchase
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

  // Get latest packet
  const { data: packet, error: packetError } = await supabase
    .from('packets')
    .select('*')
    .eq('purchase_id', id)
    .eq('user_id', user.id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  if (packetError || !packet) {
    return NextResponse.json({ error: 'No packet found' }, { status: 404 })
  }

  // Generate signed URL
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('receipts')
    .createSignedUrl(packet.storage_path, 3600)

  if (signedUrlError) {
    return NextResponse.json({ error: signedUrlError.message }, { status: 500 })
  }

  return NextResponse.json({
    packet,
    download_url: signedUrlData.signedUrl,
  })
}

