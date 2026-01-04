import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Use service role for admin operations
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export const runtime = 'nodejs'
export const maxDuration = 60

// AI prompt for extracting purchase info from order confirmation emails
const ORDER_EXTRACTION_PROMPT = `You are an expert at extracting purchase information from order confirmation emails.

Analyze the email content and extract the following information. Be thorough and accurate.

IMPORTANT: Most order confirmations DON'T have warranty info - that's OK, set warranty_months to 0.
Look for return/exchange policies - they often mention "14 days", "30 days", etc.

Return a JSON object with these fields:
{
  "is_order_confirmation": true/false,
  "item_name": "Main item or 'Multiple items from [Store]' if multiple",
  "merchant": "Store/brand name",
  "order_number": "Order/confirmation number if present",
  "purchase_date": "YYYY-MM-DD format, use email date if not in content",
  "total_amount": 123.45,
  "currency": "USD/EUR/NOK/etc",
  "return_deadline_days": 14,
  "warranty_months": 0,
  "items_list": ["item 1", "item 2"],
  "confidence": "high/medium/low",
  "notes": "Any relevant details like delivery date, tracking, etc"
}

Rules:
- If multiple items, list them in items_list and use descriptive item_name
- For return_deadline_days, extract from return policy (common: 14, 30, 60 days)
- Norwegian stores often use: 14 dager (days), angrerett (right of withdrawal)
- If price has comma as decimal (like 86,98), convert to 86.98
- Look for: "ordrenummer", "bestilling", "bekreftelse", "ordre" (Norwegian)
- Return is_order_confirmation: false if this is NOT a purchase confirmation

Return ONLY valid JSON, no explanation.`

// This endpoint receives emails via webhook from Resend
// POST /api/email/receive
export async function POST(request: NextRequest) {
  console.log('=== EMAIL WEBHOOK RECEIVED ===')
  
  try {
    // Get raw body for debugging
    const rawBody = await request.text()
    console.log('Raw body length:', rawBody.length)
    console.log('Raw body preview:', rawBody.slice(0, 1000))
    
    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch {
      console.log('Failed to parse JSON, trying as form data or other format')
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Log the full structure (for debugging)
    console.log('Parsed body keys:', Object.keys(body))
    console.log('Body type:', body.type)
    console.log('Body data keys:', body.data ? Object.keys(body.data) : 'no data field')

    // Resend webhook format - the email data is nested in different ways
    // Check for Resend's inbound email format
    let emailData = body
    
    // Resend wraps the data in { type: 'email.received', data: { ... } }
    if (body.type === 'email.received' && body.data) {
      emailData = body.data
    } else if (body.data?.email) {
      emailData = body.data.email
    } else if (body.email) {
      emailData = body.email
    }

    // Extract email fields - handle various formats
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

    console.log('Extracted email data:', {
      to,
      from,
      subject: subject.slice(0, 100),
      textBodyLength: textBody.length,
      htmlBodyLength: htmlBody.length,
      attachmentsCount: attachments.length,
      messageId
    })

    if (!from) {
      console.log('No sender email found')
      return NextResponse.json({ error: 'No sender email' }, { status: 400 })
    }

    // Find user by their "from" email address
    const supabase = getSupabaseAdmin()
    const senderEmail = from.toLowerCase().trim()
    
    console.log('Looking up user by email:', senderEmail)
    
    const { data: users, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) {
      console.error('Error listing users:', userError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const user = users?.users?.find(u => u.email?.toLowerCase() === senderEmail)
    
    if (!user) {
      console.log(`No user found for sender email: ${senderEmail}`)
      console.log('Available users:', users?.users?.map(u => u.email))
      return NextResponse.json({ 
        message: 'No Cyncro account found for this email address. Please forward from the email you used to sign up.',
        sender: senderEmail
      }, { status: 200 })
    }
    
    const userId = user.id
    console.log(`Found user: ${userId} (${user.email})`)

    // Check if we already processed this email
    const { data: existingEmail } = await supabase
      .from('processed_emails')
      .select('id')
      .eq('user_id', userId)
      .eq('email_id', messageId)
      .single()

    if (existingEmail) {
      console.log('Email already processed:', messageId)
      return NextResponse.json({ message: 'Email already processed' }, { status: 200 })
    }

    // Prepare email content for AI analysis
    // Combine subject, text body, and cleaned HTML
    const cleanHtml = htmlBody.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                              .replace(/<[^>]+>/g, ' ')
                              .replace(/\s+/g, ' ')
                              .trim()
    
    const emailContent = `Subject: ${subject}\n\nFrom: ${from}\n\n${textBody || cleanHtml}`.slice(0, 8000)
    
    console.log('Email content for AI (preview):', emailContent.slice(0, 500))

    // Analyze with AI
    const openai = getOpenAIClient()
    
    let analysis: any = null
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: ORDER_EXTRACTION_PROMPT },
          { role: 'user', content: emailContent }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })

      const content = completion.choices[0]?.message?.content || '{}'
      console.log('AI response:', content)
      
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      }
    } catch (aiError: any) {
      console.error('AI analysis error:', aiError)
      // Record the failure
      await supabase.from('processed_emails').insert({
        user_id: userId,
        email_id: messageId,
        result: 'failed',
        error_message: aiError.message
      })
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
    }

    console.log('AI analysis result:', analysis)

    // Check if this is an order confirmation
    if (!analysis || analysis.is_order_confirmation === false) {
      console.log('Not an order confirmation email')
      await supabase.from('processed_emails').insert({
        user_id: userId,
        email_id: messageId,
        result: 'not_order'
      })
      return NextResponse.json({ message: 'Email does not appear to be an order confirmation' }, { status: 200 })
    }

    // Store the email HTML as a receipt document
    let storagePath: string | null = null
    let fileName: string | null = null
    let fileType: string | null = null
    let fileSize: number | null = null

    // Check if there's an attachment first
    const receiptAttachment = attachments.find((att: any) => {
      const type = att.content_type || att.contentType || att.type || ''
      return type.startsWith('image/') || type === 'application/pdf'
    })

    if (receiptAttachment) {
      // Use the attachment as receipt
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
          .upload(storagePath, fileBuffer, { contentType: fileType || undefined })

        if (uploadError) {
          console.error('Attachment upload error:', uploadError)
          storagePath = null
        } else {
          console.log('Uploaded attachment:', storagePath)
        }
      }
    }
    
    // If no attachment or upload failed, store the email HTML as the receipt
    if (!storagePath && htmlBody) {
      // Create a styled HTML document for the email
      const emailHtmlDocument = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; background: #f5f5f5; }
    .header { background: #0f766e; color: white; padding: 15px; border-radius: 8px 8px 0 0; margin-bottom: 0; }
    .header h1 { margin: 0; font-size: 18px; }
    .header p { margin: 5px 0 0; opacity: 0.9; font-size: 14px; }
    .content { background: white; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e5e5; border-top: none; }
    .meta { color: #666; font-size: 12px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📧 Order Confirmation Email</h1>
    <p>Forwarded to Cyncro on ${new Date().toLocaleDateString()}</p>
  </div>
  <div class="content">
    <div class="meta">
      <strong>From:</strong> ${from}<br>
      <strong>Subject:</strong> ${subject}<br>
      <strong>Date:</strong> ${new Date().toLocaleString()}
    </div>
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
        console.error('HTML upload error:', htmlUploadError)
        storagePath = null
      } else {
        console.log('Stored email as HTML:', storagePath)
      }
    }

    // Calculate return deadline
    let returnDeadline: string | null = null
    if (analysis.return_deadline_days && analysis.return_deadline_days > 0) {
      const purchaseDate = analysis.purchase_date ? new Date(analysis.purchase_date) : new Date()
      purchaseDate.setDate(purchaseDate.getDate() + analysis.return_deadline_days)
      returnDeadline = purchaseDate.toISOString().split('T')[0]
    }

    // Create the purchase
    const purchaseData = {
      user_id: userId,
      item_name: analysis.item_name || subject || 'Order from Email',
      merchant: analysis.merchant || null,
      purchase_date: analysis.purchase_date || new Date().toISOString().split('T')[0],
      price: analysis.total_amount || null,
      warranty_months: analysis.warranty_months || 0,
      warranty_expires_at: analysis.warranty_months > 0 
        ? (() => {
            const d = new Date(analysis.purchase_date || new Date())
            d.setMonth(d.getMonth() + analysis.warranty_months)
            return d.toISOString().split('T')[0]
          })()
        : null,
      source: 'email_forwarded',
      order_number: analysis.order_number || null,
      return_deadline: returnDeadline,
      email_metadata: {
        subject,
        sender: from,
        received_at: new Date().toISOString(),
        confidence: analysis.confidence || 'medium',
        items_list: analysis.items_list || null,
        notes: analysis.notes || null
      },
      auto_detected: true,
      needs_review: analysis.confidence !== 'high'
    }

    console.log('Creating purchase:', purchaseData)

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert(purchaseData)
      .select()
      .single()

    if (purchaseError) {
      console.error('Purchase creation error:', purchaseError)
      await supabase.from('processed_emails').insert({
        user_id: userId,
        email_id: messageId,
        result: 'failed',
        error_message: purchaseError.message
      })
      return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 })
    }

    console.log('Created purchase:', purchase.id)

    // Attach document if we have one
    if (purchase && storagePath && fileName) {
      const { error: docError } = await supabase.from('documents').insert({
        purchase_id: purchase.id,
        user_id: userId,
        storage_path: storagePath,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
      })
      
      if (docError) {
        console.error('Document insert error:', docError)
      } else {
        console.log('Attached document to purchase')
      }
    }

    // Record processed email
    await supabase.from('processed_emails').insert({
      user_id: userId,
      email_id: messageId,
      result: 'created_purchase',
      purchase_id: purchase.id
    })

    // Create notification for the user
    try {
      // Check notification settings first
      const { data: settings } = await supabase
        .from('notification_settings')
        .select('new_purchase')
        .eq('user_id', userId)
        .single()

      if (!settings || settings.new_purchase !== false) {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'new_purchase',
          title: 'New purchase detected!',
          message: `${analysis.merchant || 'A store'} - ${analysis.item_name || 'Order received'}${analysis.total_amount ? ` (${analysis.currency || '$'}${analysis.total_amount})` : ''}`,
          action_url: `/purchases/${purchase.id}`,
          read: false
        })
        console.log('Created notification for user')
      }
    } catch (notifError) {
      console.log('Notification creation skipped:', notifError)
    }

    console.log('=== EMAIL PROCESSING COMPLETE ===')
    
    return NextResponse.json({
      success: true,
      purchase_id: purchase.id,
      item_name: purchase.item_name,
      merchant: purchase.merchant,
      message: 'Order confirmation processed successfully!'
    })

  } catch (error: any) {
    console.error('Email webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Health check / verification endpoint
export async function GET(request: NextRequest) {
  // Resend uses GET to verify the webhook endpoint
  const challenge = request.nextUrl.searchParams.get('challenge')
  if (challenge) {
    return new Response(challenge, { status: 200 })
  }
  
  return NextResponse.json({ 
    status: 'ok', 
    endpoint: 'email-receive',
    message: 'Cyncro email webhook is ready to receive forwarded receipts!'
  })
}
