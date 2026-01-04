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
const ORDER_EXTRACTION_PROMPT = `You are an intelligent email reader that can understand order confirmation emails in ANY language and format.

YOUR TASK:
Read the ENTIRE email content carefully. Analyze it to determine if it's an order confirmation/purchase receipt, then extract all available purchase information.

HOW TO IDENTIFY ORDER CONFIRMATIONS:
- Contains purchase/order confirmation language (any language)
- Shows items/products purchased
- Displays prices, totals, or payment information
- Contains order numbers, reference codes, or tracking information
- Mentions delivery, shipping, or receipt information
- Can be in ANY language (Norwegian, English, etc.)
- Can be forwarded emails (look for the ORIGINAL email content inside)

EXTRACTION RULES:
1. Read the ENTIRE email - scroll through all content, don't stop at the first paragraph
2. Extract ONLY what is explicitly stated - be precise
3. If information is missing, use null (don't guess)
4. For prices: convert comma decimals (1,217,00 → 1217.00, 86,98 → 86.98)
5. For dates: use YYYY-MM-DD format, use email received date if purchase date not found
6. For multiple items: use "Multiple items from [Merchant]" and list all in items_list

WHAT TO EXTRACT:

MERCHANT: Store/brand name from:
- Email sender domain (extract brand from domain)
- Email body (logos, headers, store names)
- Any recognizable retailer name

ORDER NUMBER: Any of:
- Order numbers, confirmation numbers
- Reference codes, order IDs
- Barcode numbers
- Transaction IDs

TOTAL AMOUNT: Look for:
- Total, Totalt, TIL SAMMEN, Sum, Total amount
- Final price after all items
- Convert to number (handle comma decimals)

CURRENCY: Extract from:
- Price symbols (kr, NOK, $, USD, €, EUR, etc.)
- Currency codes in the email

ITEMS: 
- Count all items/products listed
- If 1 item: use its name
- If 2+ items: use "Multiple items from [Merchant]"
- List all items in items_list array

PURCHASE DATE:
- Look for date of purchase, order date
- If not found, use email received date (provided separately)

RETURN DEADLINE:
- Look for return policy, exchange policy
- Common: 14 days, 30 days, 60 days
- Extract number of days

Return this JSON structure:
{
  "is_order_confirmation": true/false,
  "item_name": "string or null",
  "merchant": "string or null",
  "order_number": "string or null",
  "purchase_date": "YYYY-MM-DD or null",
  "total_amount": number or null,
  "currency": "string or null",
  "return_deadline_days": number or null,
  "warranty_months": 0,
  "items_list": ["item1", "item2"] or [],
  "confidence": "high/medium/low",
  "notes": "string or null"
}

IMPORTANT:
- Read the FULL email content, not just the beginning
- Understand context - forwarded emails contain the original email inside
- Work with ANY language - Norwegian, English, etc.
- Be thorough - scroll through all sections of the email
- Set is_order_confirmation: true if it's clearly a purchase confirmation

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
    // Extract the FULL email content with better structure preservation
    let emailContentForAI = ''
    
    // Get email received date (fallback for purchase_date)
    const emailReceivedDate = new Date().toISOString().split('T')[0]
    
    // Prefer HTML body if available (contains more structure and numbers)
    if (htmlBody) {
      // Remove scripts and styles but preserve text structure
      let cleanHtml = htmlBody
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      
      // Better text extraction - preserve structure for numbers and lists
      // Replace block elements with newlines to preserve structure
      cleanHtml = cleanHtml
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<\/tr>/gi, '\n')
        .replace(/<\/td>/gi, ' ')
        .replace(/<\/th>/gi, ' ')
      
      // Remove all remaining HTML tags but keep text
      cleanHtml = cleanHtml
        .replace(/<[^>]+>/g, ' ')
      
      // Decode HTML entities
      cleanHtml = cleanHtml
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&euro;/g, '€')
        .replace(/&pound;/g, '£')
        .replace(/&yen;/g, '¥')
      
      // Clean up whitespace but preserve line breaks for structure
      cleanHtml = cleanHtml
        .replace(/[ \t]+/g, ' ') // Multiple spaces to single
        .replace(/\n\s*\n\s*\n+/g, '\n\n') // Multiple newlines to double
        .trim()
      
      emailContentForAI = cleanHtml
    } else if (textBody) {
      emailContentForAI = textBody
    }
    
    // Combine with metadata - include received date for fallback
    const fullContent = `Email Subject: ${subject}
Email From: ${from}
Email Received Date: ${emailReceivedDate}

FULL EMAIL CONTENT (read everything, scroll through all sections):
${emailContentForAI}`
    
    // Send up to 50000 chars to ensure AI gets the FULL email (including long HTML emails)
    const emailContent = fullContent.slice(0, 50000)
    
    console.log('Email content length:', emailContent.length)
    console.log('Email content preview (first 1500 chars):', emailContent.slice(0, 1500))
    console.log('Email content preview (last 800 chars):', emailContent.slice(-800))

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
        max_tokens: 2000, // Increased for longer analysis
        temperature: 0, // Use 0 for deterministic extraction
        response_format: { type: 'json_object' } // Force JSON output
      })

      const content = completion.choices[0]?.message?.content || '{}'
      console.log('AI raw response:', content)
      
      try {
        analysis = JSON.parse(content)
        console.log('AI parsed analysis:', JSON.stringify(analysis, null, 2))
        
        // Validate extracted data
        if (analysis.is_order_confirmation === true) {
          // Ensure required fields have reasonable defaults
          if (!analysis.item_name && analysis.merchant) {
            analysis.item_name = `Order from ${analysis.merchant}`
          }
          if (!analysis.purchase_date) {
            analysis.purchase_date = emailReceivedDate
          }
          if (!analysis.currency && analysis.total_amount) {
            // Try to infer from email content
            if (emailContent.includes('kr ') || emailContent.includes('NOK')) {
              analysis.currency = 'NOK'
            } else if (emailContent.includes('$') || emailContent.includes('USD')) {
              analysis.currency = 'USD'
            } else if (emailContent.includes('€') || emailContent.includes('EUR')) {
              analysis.currency = 'EUR'
            }
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI JSON:', parseError)
        console.error('Raw content:', content)
        // Try to extract JSON from response if wrapped
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            analysis = JSON.parse(jsonMatch[0])
            console.log('AI parsed analysis (fallback):', JSON.stringify(analysis, null, 2))
          } catch (e) {
            console.error('Fallback parse also failed:', e)
          }
        }
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
    console.log('Order confirmation check:')
    console.log('- AI analysis result:', analysis?.is_order_confirmation)
    console.log('- Confidence:', analysis?.confidence)
    console.log('- Merchant:', analysis?.merchant)
    console.log('- Order number:', analysis?.order_number)

    // Trust the AI's decision - if it says it's not an order confirmation, reject
    if (!analysis || analysis.is_order_confirmation === false) {
      console.log('AI determined this is not an order confirmation')
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

    // Validate and set purchase date (use email received date as fallback)
    let purchaseDate = analysis.purchase_date || emailReceivedDate
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) {
      console.log('Invalid purchase_date format, using email received date:', purchaseDate)
      purchaseDate = emailReceivedDate
    }

    // Calculate return deadline
    let returnDeadline: string | null = null
    if (analysis.return_deadline_days && analysis.return_deadline_days > 0) {
      const returnDate = new Date(purchaseDate)
      returnDate.setDate(returnDate.getDate() + analysis.return_deadline_days)
      returnDeadline = returnDate.toISOString().split('T')[0]
    }

    // Create the purchase
    const purchaseData = {
      user_id: userId,
      item_name: analysis.item_name || subject || 'Order from Email',
      merchant: analysis.merchant || null,
      purchase_date: purchaseDate,
      price: analysis.total_amount || null,
      warranty_months: analysis.warranty_months || 0,
      warranty_expires_at: analysis.warranty_months > 0 
        ? (() => {
            const d = new Date(purchaseDate)
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
