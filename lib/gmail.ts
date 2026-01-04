import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import type { OrderExtractionResult } from './types'

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  : 'http://localhost:3000/api/auth/google/callback'

// Scopes needed for Gmail read access
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
]

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  )
}

export function getAuthUrl(state: string) {
  const oauth2Client = getOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent', // Force consent to get refresh token
  })
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials
}

export async function getGmailClient(accessToken: string) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })
  return google.gmail({ version: 'v1', auth: oauth2Client })
}

export async function getUserEmail(accessToken: string): Promise<string> {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
  const { data } = await oauth2.userinfo.get()
  return data.email || ''
}

// Get Supabase admin client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// Get OpenAI client
function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
}

// AI prompt for order extraction
const ORDER_EXTRACTION_PROMPT = `You are an expert at analyzing emails to detect online order confirmations.

Analyze the email and determine if it's an order confirmation. Look for:
- Order/confirmation numbers
- Item names and prices
- Merchant/store name
- Purchase date
- Return policy/deadline
- Shipping/delivery information

IMPORTANT CLASSIFICATION RULES:
- order_confirmation: New purchase order from a merchant (e.g., "Your order has been placed", "Order confirmation", "Thanks for your order")
- NOT order_confirmation: Shipping updates, delivery notifications, marketing emails, password resets, newsletters

For order confirmations, extract all relevant information.

Return ONLY valid JSON in this exact format:
{
  "is_order_confirmation": boolean,
  "confidence": "high" | "medium" | "low",
  "order_number": string | null,
  "items": [
    {
      "name": string,
      "price": number | null,
      "quantity": number,
      "category": string | null
    }
  ],
  "merchant": string | null,
  "order_date": "YYYY-MM-DD" | null,
  "total_amount": number | null,
  "currency": string | null,
  "return_deadline": "YYYY-MM-DD" | null,
  "warranty_months": number | null,
  "tracking_number": string | null,
  "estimated_delivery": "YYYY-MM-DD" | null
}

CATEGORY SUGGESTIONS:
- "Electronics" for phones, computers, gadgets
- "Clothing" for apparel, shoes, accessories
- "Home" for furniture, home goods
- "Food" for groceries, restaurants
- "Travel" for flights, hotels, bookings
- "Entertainment" for games, movies, subscriptions
- "Health" for pharmacy, fitness
- null if unclear

WARRANTY ESTIMATION:
- Electronics: 12-24 months
- Appliances: 24 months
- Clothing: 0 (no warranty, but has return period)
- Furniture: 24 months
- Default: 12 months if not specified

RETURN DEADLINE ESTIMATION:
- If return policy days are mentioned, calculate from order date
- Common defaults: Clothing 30 days, Electronics 14-30 days
- If no return policy found, leave as null`

export async function analyzeEmailForOrder(
  subject: string,
  body: string,
  sender: string
): Promise<OrderExtractionResult> {
  const openai = getOpenAI()

  const emailContent = `
From: ${sender}
Subject: ${subject}

${body.slice(0, 4000)}
`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: ORDER_EXTRACTION_PROMPT },
      { role: 'user', content: emailContent },
    ],
    max_tokens: 1000,
    temperature: 0.1,
  })

  const content = completion.choices[0]?.message?.content || '{}'
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as OrderExtractionResult
    }
  } catch {
    console.error('Failed to parse AI response:', content)
  }

  return {
    is_order_confirmation: false,
    confidence: 'low',
    order_number: null,
    items: [],
    merchant: null,
    order_date: null,
    total_amount: null,
    currency: null,
    return_deadline: null,
    warranty_months: null,
    tracking_number: null,
    estimated_delivery: null,
  }
}

// Fetch and parse email message
export async function fetchEmailMessage(gmail: any, messageId: string) {
  const { data: message } = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  })

  // Extract headers
  const headers = message.payload?.headers || []
  const getHeader = (name: string) => 
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

  const subject = getHeader('Subject')
  const from = getHeader('From')
  const date = getHeader('Date')

  // Extract body
  let body = ''
  const extractBody = (part: any): string => {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return Buffer.from(part.body.data, 'base64').toString('utf-8')
    }
    if (part.mimeType === 'text/html' && part.body?.data) {
      const html = Buffer.from(part.body.data, 'base64').toString('utf-8')
      // Strip HTML tags for text analysis
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    }
    if (part.parts) {
      return part.parts.map(extractBody).join('\n')
    }
    return ''
  }

  body = extractBody(message.payload)

  return {
    id: message.id,
    threadId: message.threadId,
    subject,
    from,
    date,
    body,
    internalDate: message.internalDate,
  }
}

// Sync emails for a user
export async function syncGmailEmails(userId: string) {
  const supabase = getSupabaseAdmin()

  // Get user's email connection
  const { data: connection, error: connError } = await supabase
    .from('email_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'gmail')
    .single()

  if (connError || !connection) {
    throw new Error('No Gmail connection found')
  }

  if (!connection.sync_enabled) {
    return { synced: 0, message: 'Sync disabled' }
  }

  // Refresh token if needed
  let accessToken = connection.access_token
  const tokenExpires = new Date(connection.token_expires_at)
  
  if (tokenExpires <= new Date()) {
    try {
      const newCredentials = await refreshAccessToken(connection.refresh_token)
      accessToken = newCredentials.access_token!
      
      await supabase
        .from('email_connections')
        .update({
          access_token: accessToken,
          token_expires_at: new Date(newCredentials.expiry_date!).toISOString(),
        })
        .eq('id', connection.id)
    } catch (error) {
      console.error('Failed to refresh token:', error)
      throw new Error('Failed to refresh Gmail token')
    }
  }

  const gmail = await getGmailClient(accessToken)

  // Search for order-related emails from last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const afterDate = sevenDaysAgo.toISOString().split('T')[0].replace(/-/g, '/')

  // Search query for potential order emails
  const searchQuery = `after:${afterDate} (subject:order OR subject:confirmation OR subject:receipt OR subject:purchase OR subject:"your order" OR subject:"order confirmation")`

  const { data: listData } = await gmail.users.messages.list({
    userId: 'me',
    q: searchQuery,
    maxResults: 50,
  })

  const messages = listData.messages || []
  let syncedCount = 0
  const errors: string[] = []

  for (const msg of messages) {
    // Skip if no message ID
    if (!msg.id) continue
    
    const messageId = msg.id
    
    try {
      // Check if already processed
      const { data: existing } = await supabase
        .from('processed_emails')
        .select('id')
        .eq('user_id', userId)
        .eq('email_id', messageId)
        .single()

      if (existing) {
        continue // Skip already processed
      }

      // Fetch full message
      const email = await fetchEmailMessage(gmail, messageId)

      // Analyze with AI
      const analysis = await analyzeEmailForOrder(email.subject, email.body, email.from)

      if (!analysis.is_order_confirmation) {
        // Mark as processed but not an order
        await supabase.from('processed_emails').insert({
          user_id: userId,
          email_id: messageId,
          result: 'not_order',
        })
        continue
      }

      // Check for duplicates by order number
      if (analysis.order_number) {
        const { data: existingPurchase } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', userId)
          .eq('order_number', analysis.order_number)
          .single()

        if (existingPurchase) {
          await supabase.from('processed_emails').insert({
            user_id: userId,
            email_id: messageId,
            result: 'ignored',
            purchase_id: existingPurchase.id,
          })
          continue
        }
      }

      // Get merchant defaults
      let defaultWarranty = analysis.warranty_months || 12
      let defaultReturnDays = 30

      if (analysis.merchant) {
        const { data: merchant } = await supabase
          .from('merchants')
          .select('default_warranty_months, default_return_days')
          .ilike('name', `%${analysis.merchant}%`)
          .single()

        if (merchant) {
          defaultWarranty = analysis.warranty_months || merchant.default_warranty_months
          defaultReturnDays = merchant.default_return_days
        }
      }

      // Calculate warranty expiry and return deadline
      const purchaseDate = analysis.order_date || new Date().toISOString().split('T')[0]
      const warrantyExpiry = defaultWarranty > 0 
        ? new Date(new Date(purchaseDate).getTime() + defaultWarranty * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null
      
      const returnDeadline = analysis.return_deadline || (defaultReturnDays > 0
        ? new Date(new Date(purchaseDate).getTime() + defaultReturnDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null)

      // Create purchases for each item (or one if no items extracted)
      const itemsToCreate = analysis.items.length > 0 ? analysis.items : [{ 
        name: analysis.merchant ? `Order from ${analysis.merchant}` : 'New Purchase',
        price: analysis.total_amount,
        quantity: 1,
        category: null
      }]

      for (const item of itemsToCreate) {
        const { data: purchase, error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            user_id: userId,
            item_name: item.name,
            merchant: analysis.merchant,
            purchase_date: purchaseDate,
            price: item.price,
            warranty_months: defaultWarranty,
            warranty_expires_at: warrantyExpiry,
            category: item.category,
            source: 'gmail_auto',
            order_number: analysis.order_number,
            return_deadline: returnDeadline,
            email_metadata: {
              subject: email.subject,
              sender: email.from,
              received_at: email.date,
              gmail_message_id: messageId,
              confidence: analysis.confidence,
            },
            auto_detected: true,
            needs_review: analysis.confidence !== 'high',
          })
          .select()
          .single()

        if (purchaseError) {
          errors.push(`Failed to create purchase: ${purchaseError.message}`)
          continue
        }

        // Create notification for new purchase
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'new_purchase',
          title: 'New purchase detected!',
          message: `We found an order for "${item.name}" from ${analysis.merchant || 'Unknown store'}`,
          purchase_id: purchase.id,
          action_url: `/purchases/${purchase.id}`,
        })

        syncedCount++
      }

      // Mark email as processed
      await supabase.from('processed_emails').insert({
        user_id: userId,
        email_id: messageId,
        result: 'created_purchase',
      })

    } catch (error: any) {
      console.error(`Error processing email ${messageId}:`, error)
      errors.push(error.message)
      
      // Mark as failed
      try {
        await supabase.from('processed_emails').insert({
          user_id: userId,
          email_id: messageId,
          result: 'failed',
          error_message: error.message,
        })
      } catch {
        // Ignore insert errors
      }
    }
  }

  // Update last sync time
  await supabase
    .from('email_connections')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', connection.id)

  return { 
    synced: syncedCount, 
    total: messages.length,
    errors: errors.length > 0 ? errors : undefined 
  }
}

// Check and create expiry notifications
export async function checkExpiryNotifications(userId: string) {
  const supabase = getSupabaseAdmin()

  // Get user's notification settings
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!settings) return

  const now = new Date()
  const notificationsToCreate: any[] = []

  // Check warranty expiring
  if (settings.warranty_expiring) {
    const warningDate = new Date(now)
    warningDate.setDate(warningDate.getDate() + settings.warranty_expiring_days)

    const { data: expiringWarranties } = await supabase
      .from('purchases')
      .select('id, item_name, warranty_expires_at, merchant')
      .eq('user_id', userId)
      .not('warranty_expires_at', 'is', null)
      .gte('warranty_expires_at', now.toISOString().split('T')[0])
      .lte('warranty_expires_at', warningDate.toISOString().split('T')[0])

    for (const purchase of expiringWarranties || []) {
      // Check if notification already exists
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('purchase_id', purchase.id)
        .eq('type', 'warranty_expiring')
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .single()

      if (!existing) {
        const daysLeft = Math.ceil((new Date(purchase.warranty_expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        notificationsToCreate.push({
          user_id: userId,
          type: 'warranty_expiring',
          title: 'Warranty expiring soon',
          message: `Warranty for "${purchase.item_name}"${purchase.merchant ? ` from ${purchase.merchant}` : ''} expires in ${daysLeft} days`,
          purchase_id: purchase.id,
          action_url: `/purchases/${purchase.id}`,
          expires_at: purchase.warranty_expires_at,
        })
      }
    }
  }

  // Check return deadline
  if (settings.return_deadline) {
    const warningDate = new Date(now)
    warningDate.setDate(warningDate.getDate() + settings.return_deadline_days)

    const { data: expiringReturns } = await supabase
      .from('purchases')
      .select('id, item_name, return_deadline, merchant')
      .eq('user_id', userId)
      .not('return_deadline', 'is', null)
      .gte('return_deadline', now.toISOString().split('T')[0])
      .lte('return_deadline', warningDate.toISOString().split('T')[0])

    for (const purchase of expiringReturns || []) {
      // Check if notification already exists
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('purchase_id', purchase.id)
        .eq('type', 'return_deadline')
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .single()

      if (!existing) {
        const daysLeft = Math.ceil((new Date(purchase.return_deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        notificationsToCreate.push({
          user_id: userId,
          type: 'return_deadline',
          title: 'Return deadline approaching',
          message: `Return deadline for "${purchase.item_name}"${purchase.merchant ? ` from ${purchase.merchant}` : ''} is in ${daysLeft} days`,
          purchase_id: purchase.id,
          action_url: `/purchases/${purchase.id}`,
          expires_at: purchase.return_deadline,
        })
      }
    }
  }

  // Create all notifications
  if (notificationsToCreate.length > 0) {
    await supabase.from('notifications').insert(notificationsToCreate)
  }

  return { created: notificationsToCreate.length }
}

