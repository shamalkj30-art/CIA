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

// This endpoint receives emails via webhook from Resend/SendGrid
// POST /api/email/receive
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get('x-webhook-secret') || request.headers.get('authorization')
    if (process.env.EMAIL_WEBHOOK_SECRET && webhookSecret !== `Bearer ${process.env.EMAIL_WEBHOOK_SECRET}`) {
      console.log('Webhook auth failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Received email webhook:', JSON.stringify(body, null, 2).slice(0, 500))

    // Extract email data (format depends on provider)
    // Resend format
    const to = body.to?.[0] || body.to
    const from = body.from?.email || body.from
    const subject = body.subject || ''
    const textBody = body.text || body.plain || ''
    const htmlBody = body.html || ''
    const attachments = body.attachments || []

    if (!to) {
      return NextResponse.json({ error: 'No recipient' }, { status: 400 })
    }

    // Find user by their "from" email address (simple approach)
    // User just forwards from their registered email to receipts@domain.com
    const supabase = getSupabaseAdmin()
    const senderEmail = from?.toLowerCase()
    
    const { data: users } = await supabase.auth.admin.listUsers()
    const user = users?.users?.find(u => u.email?.toLowerCase() === senderEmail)
    
    if (!user) {
      console.log(`No user found for sender email: ${senderEmail}`)
      return NextResponse.json({ 
        message: 'No account found for this email. Make sure you forward from the same email you used to sign up.' 
      }, { status: 200 })
    }
    
    const userId = user.id

    // Verify user exists
    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    if (!userData?.user) {
      console.log(`User ID ${userId} not found in database`)
      return NextResponse.json({ message: 'User not found' }, { status: 200 })
    }

    console.log(`Processing email for user: ${userId}`)

    // Find receipt attachment (image or PDF)
    const receiptAttachment = attachments.find((att: any) => {
      const type = att.content_type || att.contentType || att.type || ''
      return type.startsWith('image/') || type === 'application/pdf'
    })

    let analysisText = ''
    let storagePath: string | null = null
    let fileType: string | null = null
    let fileSize: number | null = null
    let finalFileName: string | null = null

    if (receiptAttachment) {
      // Process attachment
      const attachmentData = receiptAttachment.content || receiptAttachment.data
      const fileBuffer = Buffer.from(attachmentData, 'base64')
      fileType = receiptAttachment.content_type || receiptAttachment.contentType || 'application/octet-stream'
      const fileName = receiptAttachment.filename || receiptAttachment.name || `receipt_${Date.now()}`
      finalFileName = fileName
      fileSize = fileBuffer.length

      // Upload to storage
      const timestamp = Date.now()
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
      storagePath = `${userId}/${timestamp}_${sanitizedName}`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(storagePath, fileBuffer, { contentType: fileType || undefined })

      if (uploadError) {
        console.error('Upload error:', uploadError)
      }

      // Analyze with AI
      const openai = getOpenAIClient()

      if (fileType === 'application/pdf') {
        // Extract text from PDF
        try {
          const { extractTextFromPdf } = await import('@/lib/pdf-to-image')
          const pdfText = await extractTextFromPdf(fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength))
          analysisText = pdfText
        } catch (e) {
          console.log('PDF text extraction failed, using email body')
          analysisText = textBody || htmlBody.replace(/<[^>]*>/g, ' ')
        }
      } else {
        // Image - use Vision API
        const base64 = fileBuffer.toString('base64')
        const dataUrl = `data:${fileType};base64,${base64}`

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Extract purchase info from this receipt. Return JSON with: item_name, merchant, purchase_date (YYYY-MM-DD), warranty_months, total_amount, currency, confidence, missing_fields.',
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extract purchase information from this receipt image. Return only valid JSON.' },
                { type: 'image_url', image_url: { url: dataUrl } },
              ],
            },
          ],
          max_tokens: 500,
        })

        const content = completion.choices[0]?.message?.content || '{}'
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0])
          
          // Create purchase
          const { data: purchase, error: purchaseError } = await supabase
            .from('purchases')
            .insert({
              user_id: userId,
              item_name: analysis.item_name || subject || 'Email Receipt',
              merchant: analysis.merchant || null,
              purchase_date: analysis.purchase_date || new Date().toISOString().split('T')[0],
              warranty_months: analysis.warranty_months || 0,
            })
            .select()
            .single()

          if (!purchaseError && purchase && storagePath) {
            await supabase.from('documents').insert({
              purchase_id: purchase.id,
              user_id: userId,
              storage_path: storagePath,
              file_name: finalFileName,
              file_type: fileType,
              file_size: fileSize,
            })
          }

          return NextResponse.json({
            success: true,
            purchase_id: purchase?.id,
            message: 'Receipt processed successfully',
          })
        }
      }
    }

    // If no attachment or couldn't process, try to extract from email body
    if (!receiptAttachment || analysisText) {
      const emailContent = analysisText || textBody || htmlBody.replace(/<[^>]*>/g, ' ')
      
      if (emailContent.length > 50) {
        const openai = getOpenAIClient()
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Extract purchase info from this email/receipt text. Return JSON with: item_name, merchant, purchase_date (YYYY-MM-DD), warranty_months, total_amount, currency. If not a receipt, return {"is_receipt": false}.',
            },
            {
              role: 'user',
              content: `Subject: ${subject}\n\n${emailContent.slice(0, 3000)}`,
            },
          ],
          max_tokens: 500,
        })

        const content = completion.choices[0]?.message?.content || '{}'
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0])
          
          if (analysis.is_receipt === false) {
            return NextResponse.json({ message: 'Email does not appear to be a receipt' })
          }

          // Create purchase
          const { data: purchase } = await supabase
            .from('purchases')
            .insert({
              user_id: userId,
              item_name: analysis.item_name || subject || 'Email Receipt',
              merchant: analysis.merchant || null,
              purchase_date: analysis.purchase_date || new Date().toISOString().split('T')[0],
              warranty_months: analysis.warranty_months || 0,
            })
            .select()
            .single()

          if (purchase && storagePath && finalFileName) {
            await supabase.from('documents').insert({
              purchase_id: purchase.id,
              user_id: userId,
              storage_path: storagePath,
              file_name: finalFileName,
              file_type: fileType,
              file_size: fileSize,
            })
          }

          return NextResponse.json({
            success: true,
            purchase_id: purchase?.id,
            message: 'Receipt processed from email body',
          })
        }
      }
    }

    return NextResponse.json({ message: 'Could not process email as receipt' })
  } catch (error: any) {
    console.error('Email webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'email-receive' })
}
