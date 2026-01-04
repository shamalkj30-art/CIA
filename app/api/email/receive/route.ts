/**
 * Email Webhook Handler - Receives forwarded purchase emails via Resend
 * Improved with structured AI extraction, validation, and proper error handling
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { parseEmailHtml, detectEmailLanguage } from '@/lib/email-parser'
import { extractOrderData } from '@/lib/ai-extraction'
import { isPurchaseEmail } from '@/lib/email-schemas'
import { extractTextFromAttachment } from '@/lib/pdf-extractor'

// Use service role for admin operations
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Main webhook handler for incoming emails
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('=== EMAIL WEBHOOK RECEIVED ===')

  try {
    // Parse webhook body
    const rawBody = await request.text()
    console.log('📧 Raw body length:', rawBody.length)

    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch {
      console.error('❌ Failed to parse JSON')
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    console.log('📦 Body type:', body.type)

    // Extract email data from Resend webhook format
    let emailData = body
    if (body.type === 'email.received' && body.data) {
      emailData = body.data
    } else if (body.data?.email) {
      emailData = body.data.email
    } else if (body.email) {
      emailData = body.email
    }

    // Parse email fields
    const to = emailData.to?.[0]?.email || emailData.to?.[0] || emailData.to || ''
    const fromData = emailData.from
    const from = typeof fromData === 'string'
      ? fromData
      : fromData?.email || fromData?.address || ''
    const subject = emailData.subject || ''
    const textBody = emailData.text || emailData.plain || emailData.body?.plain || ''
    const htmlBody = emailData.html || emailData.body?.html || ''
    const attachments = emailData.attachments || []
    const messageId = emailData.message_id || emailData.messageId || emailData.id || `email_${Date.now()}`

    console.log('📨 Email:', {
      to: to.slice(0, 50),
      from: from.slice(0, 50),
      subject: subject.slice(0, 80),
      textLength: textBody.length,
      htmlLength: htmlBody.length,
      attachments: attachments.length,
      messageId
    })

    // Validate sender email
    if (!from) {
      console.error('❌ No sender email found')
      return NextResponse.json({ error: 'No sender email' }, { status: 400 })
    }

    // Find user by sender email
    const supabase = getSupabaseAdmin()
    const senderEmail = from.toLowerCase().trim()

    console.log('🔍 Looking up user:', senderEmail)

    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) {
      console.error('❌ Error listing users:', userError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const user = users?.users?.find(u => u.email?.toLowerCase() === senderEmail)

    if (!user) {
      console.log('⚠️ No user found for:', senderEmail)
      return NextResponse.json(
        {
          message: 'No Cyncro account found for this email address. Please forward from your registered email.',
          sender: senderEmail
        },
        { status: 200 }
      )
    }

    const userId = user.id
    console.log('✅ Found user:', user.email)

    // Check for duplicate processing
    const { data: existingEmail } = await supabase
      .from('processed_emails')
      .select('id')
      .eq('user_id', userId)
      .eq('email_id', messageId)
      .single()

    if (existingEmail) {
      console.log('⚠️ Email already processed:', messageId)
      return NextResponse.json({ message: 'Email already processed' }, { status: 200 })
    }

    // === IMPROVED EMAIL PARSING ===

    // Step 1: Parse HTML to structured text (preserves tables!)
    const parsed = parseEmailHtml(htmlBody)
    const emailText = textBody || parsed.text

    console.log('📄 Parsed email:', {
      textLength: emailText.length,
      hasTables: parsed.hasStructuredData,
      tablesCount: parsed.extractedTables.length
    })

    // Step 2: Extract PDF text if invoice attached
    let pdfText: string | null = null
    const pdfAttachment = attachments.find((att: any) => {
      const type = att.content_type || att.contentType || att.type || ''
      return type.includes('pdf')
    })

    if (pdfAttachment) {
      console.log('📎 PDF attachment found, extracting text...')
      pdfText = await extractTextFromAttachment(pdfAttachment)
      if (pdfText) {
        console.log('✅ PDF text extracted:', pdfText.length, 'chars')
      }
    }

    // Step 3: Combine email text + PDF text (if available)
    // CRITICAL FIX: DO NOT include "From: <email>" - that caused the "gmail" bug!
    const fullContent = `
${pdfText ? '=== PDF INVOICE ===\n' + pdfText + '\n=== END PDF ===\n\n' : ''}${emailText}
    `.trim()

    console.log('📋 Full content length:', fullContent.length)

    // Step 4: Quick language detection
    const detectedLang = detectEmailLanguage(fullContent)
    console.log('🌍 Detected language:', detectedLang)

    // === AI EXTRACTION (with retry logic built-in) ===

    console.log('🤖 Starting AI extraction...')

    const extractionResult = await extractOrderData({
      emailContent: fullContent.slice(0, 15000), // Limit to 15k chars
      subject: subject,
      hasAttachment: attachments.length > 0,
      attachmentType: pdfAttachment?.content_type || null,
      maxRetries: 2 // Will retry once on validation failure
    })

    if (!extractionResult.success || !extractionResult.data) {
      console.error('❌ AI extraction failed:', extractionResult.error)

      // Record failure
      await supabase.from('processed_emails').insert({
        user_id: userId,
        email_id: messageId,
        result: 'failed',
        error_message: extractionResult.error || 'AI extraction failed'
      })

      return NextResponse.json(
        { error: 'Failed to analyze email', details: extractionResult.error },
        { status: 500 }
      )
    }

    const extraction = extractionResult.data

    console.log('✅ AI extraction complete:', {
      type: extraction.email_type,
      merchant: extraction.merchant_name,
      amount: extraction.total_amount,
      currency: extraction.currency,
      confidence: extraction.confidence.overall,
      retries: extractionResult.retries
    })

    // Check if this is actually a purchase email
    if (!isPurchaseEmail(extraction)) {
      console.log('ℹ️ Not a purchase email')

      await supabase.from('processed_emails').insert({
        user_id: userId,
        email_id: messageId,
        result: 'not_purchase'
      })

      return NextResponse.json(
        {
          message: 'Email does not appear to be an order confirmation',
          email_type: extraction.email_type
        },
        { status: 200 }
      )
    }

    // === STORE RECEIPT FILE ===

    let storagePath: string | null = null
    let fileName: string | null = null
    let fileType: string | null = null
    let fileSize: number | null = null

    // Prefer PDF attachment, fallback to email HTML
    const receiptAttachment = attachments.find((att: any) => {
      const type = att.content_type || att.contentType || att.type || ''
      return type.includes('pdf') || type.startsWith('image/')
    })

    if (receiptAttachment) {
      // Upload attachment
      const attachmentData = receiptAttachment.content || receiptAttachment.data
      if (attachmentData) {
        const fileBuffer = Buffer.from(attachmentData, 'base64')
        fileType = receiptAttachment.content_type || receiptAttachment.contentType || 'application/octet-stream'
        const attachmentFileName = receiptAttachment.filename || receiptAttachment.name || `receipt_${Date.now()}`
        fileName = attachmentFileName
        fileSize = fileBuffer.length

        const timestamp = Date.now()
        const sanitizedName = attachmentFileName.replace(/[^a-zA-Z0-9.-]/g, '_')
        storagePath = `${userId}/${timestamp}_${sanitizedName}`

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(storagePath, fileBuffer, { contentType: fileType })

        if (uploadError) {
          console.error('❌ Attachment upload error:', uploadError)
          storagePath = null
        } else {
          console.log('✅ Uploaded attachment:', storagePath)
        }
      }
    }

    // Fallback: Store email HTML
    if (!storagePath && htmlBody) {
      const emailHtmlDocument = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; background: #f5f5f5; }
    .header { background: #0f766e; color: white; padding: 15px; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e5e5; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📧 ${extraction.merchant_name || 'Order Confirmation'}</h1>
    <p>Received: ${new Date().toLocaleDateString()}</p>
  </div>
  <div class="content">
    <p><strong>Subject:</strong> ${subject}</p>
    ${htmlBody}
  </div>
</body>
</html>`

      const emailBuffer = Buffer.from(emailHtmlDocument, 'utf-8')
      const timestamp = Date.now()
      storagePath = `${userId}/${timestamp}_email_receipt.html`
      fileName = 'email_receipt.html'
      fileType = 'text/html'
      fileSize = emailBuffer.length

      const { error: htmlUploadError } = await supabase.storage
        .from('receipts')
        .upload(storagePath, emailBuffer, { contentType: 'text/html' })

      if (htmlUploadError) {
        console.error('❌ HTML upload error:', htmlUploadError)
        storagePath = null
      } else {
        console.log('✅ Stored email HTML:', storagePath)
      }
    }

    // === CREATE PURCHASE RECORD ===

    // Calculate return deadline
    let returnDeadline: string | null = null
    if (extraction.return_deadline_days && extraction.return_deadline_days > 0) {
      const purchaseDate = extraction.purchase_date
        ? new Date(extraction.purchase_date)
        : new Date()
      purchaseDate.setDate(purchaseDate.getDate() + extraction.return_deadline_days)
      returnDeadline = purchaseDate.toISOString().split('T')[0]
    }

    // Calculate warranty expiration
    let warrantyExpiration: string | null = null
    if (extraction.warranty_months && extraction.warranty_months > 0) {
      const purchaseDate = extraction.purchase_date
        ? new Date(extraction.purchase_date)
        : new Date()
      purchaseDate.setMonth(purchaseDate.getMonth() + extraction.warranty_months)
      warrantyExpiration = purchaseDate.toISOString().split('T')[0]
    }

    const purchaseData = {
      user_id: userId,
      item_name:
        extraction.item_name ||
        (extraction.items_list && extraction.items_list.length > 0
          ? `Multiple items from ${extraction.merchant_name}`
          : `Order from ${extraction.merchant_name}`),
      merchant: extraction.merchant_name,
      purchase_date: extraction.purchase_date || new Date().toISOString().split('T')[0],
      price: extraction.total_amount || null,
      currency: extraction.currency || null,
      warranty_months: extraction.warranty_months || 0,
      warranty_expires_at: warrantyExpiration,
      source: 'email_forwarded',
      order_number: extraction.order_number || null,
      return_deadline: returnDeadline,
      email_metadata: {
        subject,
        sender: from,
        received_at: new Date().toISOString(),
        language: extraction.language,
        email_type: extraction.email_type,
        merchant_category: extraction.merchant_category,
        confidence: extraction.confidence,
        items_list: extraction.items_list || null,
        items_count: extraction.items_count || null,
        extraction_notes: extraction.extraction_notes || null,
        ai_retries: extractionResult.retries
      },
      auto_detected: true,
      needs_review: extraction.needs_review || extraction.confidence.overall !== 'high'
    }

    console.log('💾 Creating purchase record...')

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert(purchaseData)
      .select()
      .single()

    if (purchaseError) {
      console.error('❌ Purchase creation error:', purchaseError)

      await supabase.from('processed_emails').insert({
        user_id: userId,
        email_id: messageId,
        result: 'failed',
        error_message: purchaseError.message
      })

      return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 })
    }

    console.log('✅ Created purchase:', purchase.id)

    // Attach receipt document
    if (purchase && storagePath && fileName) {
      const { error: docError } = await supabase.from('documents').insert({
        purchase_id: purchase.id,
        user_id: userId,
        storage_path: storagePath,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize
      })

      if (docError) {
        console.error('❌ Document attach error:', docError)
      } else {
        console.log('✅ Attached document to purchase')
      }
    }

    // Record successful processing
    await supabase.from('processed_emails').insert({
      user_id: userId,
      email_id: messageId,
      result: 'created_purchase',
      purchase_id: purchase.id
    })

    // Create notification
    try {
      const { data: settings } = await supabase
        .from('notification_settings')
        .select('new_purchase')
        .eq('user_id', userId)
        .single()

      if (!settings || settings.new_purchase !== false) {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'new_purchase',
          title: extraction.needs_review
            ? '⚠️ New purchase detected (needs review)'
            : '✅ New purchase detected!',
          message: `${extraction.merchant_name}${extraction.total_amount ? ` - ${extraction.currency} ${extraction.total_amount}` : ''}`,
          action_url: `/purchases/${purchase.id}`,
          read: false
        })
        console.log('✅ Created notification')
      }
    } catch (notifError) {
      console.log('⚠️ Notification creation skipped:', notifError)
    }

    const processingTime = Date.now() - startTime
    console.log(`✅ === EMAIL PROCESSING COMPLETE (${processingTime}ms) ===`)

    return NextResponse.json({
      success: true,
      purchase_id: purchase.id,
      merchant: purchase.merchant,
      amount: purchase.price,
      currency: purchaseData.currency,
      confidence: extraction.confidence.overall,
      needs_review: extraction.needs_review,
      processing_time_ms: processingTime
    })
  } catch (error: any) {
    console.error('❌ Email webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge')
  if (challenge) {
    return new Response(challenge, { status: 200 })
  }

  return NextResponse.json({
    status: 'ok',
    endpoint: 'email-receive',
    message: 'Cyncro email webhook is ready!',
    features: [
      'Anthropic Claude AI extraction',
      'Multilingual support (NO/EN/SV/DA)',
      'PDF invoice parsing',
      'Table-aware HTML parsing',
      'Currency normalization',
      'Zod validation with retry'
    ]
  })
}
