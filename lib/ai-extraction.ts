/**
 * AI-powered Email Extraction using Anthropic Claude
 * with Structured Output via Tool Calling
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  OrderExtraction,
  validateExtraction,
  needsManualReview
} from './email-schemas'
import { normalizeCurrency, findTotalAmount, extractAllAmounts, inferCurrency } from './currency-utils'
import { detectEmailLanguage } from './email-parser'

interface ExtractionOptions {
  emailContent: string
  subject: string
  hasAttachment: boolean
  attachmentType?: string | null
  maxRetries?: number
  merchantHint?: string | null // Pre-extracted merchant hint from subject line
}

interface ExtractionResult {
  success: boolean
  data?: OrderExtraction
  error?: string
  retries: number
}

/**
 * System prompt for email extraction - Improved for common sense extraction
 */
const SYSTEM_PROMPT = `You are an expert email analyzer that extracts purchase information with COMMON SENSE reasoning.

## YOUR #1 PRIORITY: CORRECT MERCHANT NAME
The merchant is the STORE/COMPANY that SOLD the product. This is CRITICAL.

### SUBJECT LINE IS YOUR BEST FRIEND
The subject line almost ALWAYS contains the merchant name. Examples:
- "Your receipt from Anthropic, PBC #123" → Merchant: "Anthropic"
- "Fwd: Order confirmation - Zara" → Merchant: "Zara"
- "Receipt from Apple Store" → Merchant: "Apple"
- "Takk for kjøpet hos Elkjøp" → Merchant: "Elkjøp"

### ABSOLUTE RULES FOR MERCHANT:
1. ✅ ALWAYS check the subject line FIRST - it usually has the store name
2. ✅ Look for "from [Store]", "[Store] - Order", "Thank you for shopping at [Store]"
3. ✅ Company names like "Anthropic, PBC", "Apple Inc", "ZARA NORGE AS" are merchants
4. ❌ NEVER use email providers: gmail, outlook, yahoo, hotmail, icloud
5. ❌ NEVER use generic terms: email, mail, receipt, order, unknown
6. ❌ NEVER use the forwarding user's email domain

### IF MERCHANT HINT IS PROVIDED, USE IT!
If the context provides a "Merchant hint from subject:", TRUST IT and use that as the merchant name.

## COMMON SENSE RULES (USE YOUR BRAIN!)

### Delivery Estimates
- "Delivery in 3-5 days" with order date Jan 4 → estimated_delivery_date = "2025-01-09" (use middle value)
- "Ships within 1-2 business days" → Add 4-5 days for delivery
- "Express shipping (1 day)" → estimated_delivery_date = order date + 1

### Return Policies
- Most clothing stores: 14-30 days (default to 14 if not specified for apparel)
- Electronics: Usually 14-30 days open box
- "Angrerett" (Norwegian) = 14 days by law for online purchases
- If email mentions "full refund within X days", use X

### Warranty
- Electronics: Usually 12-24 months
- Appliances: Usually 24 months
- Software/digital: Usually 0 (no warranty)
- "Reklamasjonsrett" (Norwegian) = 2-5 years depending on product lifespan

### Currency Detection
- Norwegian stores (Elkjøp, Komplett, CDON.no): NOK
- Swedish stores (IKEA SE, Boozt): SEK
- Euro zone stores: EUR
- US stores: USD
- Look for kr, NOK, $, €, £ symbols

## LANGUAGE DETECTION
- Norwegian (no): "Takk for", "bestilling", "kvittering", "kr", "NOK"
- English (en): "Thank you", "order", "receipt", "total"
- Swedish (sv): "Tack för", "beställning", "kronor"
- Danish (da): "Tak for", "ordre"
- German (de): "Danke", "Bestellung"

## EMAIL TYPE
- order_confirmation: "Order confirmed", "Takk for kjøpet"
- payment_receipt: "Payment received", "Kvittering"
- shipping_confirmation: "Shipped", "Sendt", "On its way"
- delivery_confirmation: "Delivered", "Levert"
- invoice: "Invoice", "Faktura"
- thank_you: Generic thank you without order details
- unknown: Cannot determine

## AMOUNT EXTRACTION
Find the TOTAL amount (not subtotals or individual items):
- European format: "1.234,56" = 1234.56
- US format: "1,234.56" = 1234.56
- Norwegian: "kr 1 234" = 1234 NOK

## CONFIDENCE LEVELS
- high: Found merchant in subject + total amount + date clearly
- medium: Found most fields but some uncertainty
- low: Significant guessing required

## CRITICAL: NEVER RETURN EMAIL PROVIDER AS MERCHANT
If you're about to return "gmail", "yahoo", "outlook", etc as merchant_name, STOP and re-read the subject line.`

/**
 * Tool definition for Anthropic structured output
 */
const EXTRACTION_TOOL: Anthropic.Tool = {
  name: 'extract_order_data',
  description: 'Extract structured purchase information from an order confirmation email',
  input_schema: {
    type: 'object',
    properties: {
      language: {
        type: 'string',
        enum: ['no', 'en', 'sv', 'da', 'de', 'fr', 'other'],
        description: 'Detected language of the email'
      },
      email_type: {
        type: 'string',
        enum: [
          'order_confirmation',
          'payment_receipt',
          'shipping_confirmation',
          'delivery_confirmation',
          'refund',
          'invoice',
          'thank_you',
          'unknown'
        ],
        description: 'Type of email'
      },
      is_purchase: {
        type: 'boolean',
        description: 'True if this email is related to a purchase/order'
      },
      merchant_name: {
        type: 'string',
        description: 'Name of the store/brand (NOT email provider like gmail)'
      },
      merchant_category: {
        type: 'string',
        enum: ['apparel', 'beauty', 'electronics', 'groceries', 'home', 'travel', 'subscriptions', 'entertainment', 'health', 'other'],
        description: 'Category of the merchant'
      },
      merchant_website: {
        type: 'string',
        description: 'Website URL if found'
      },
      order_number: {
        type: 'string',
        description: 'Order number or reference'
      },
      purchase_date: {
        type: 'string',
        description: 'Purchase date in YYYY-MM-DD format'
      },
      total_amount: {
        type: 'number',
        description: 'Total amount paid'
      },
      currency: {
        type: 'string',
        description: 'ISO 4217 currency code (e.g., NOK, EUR, USD)'
      },
      item_name: {
        type: 'string',
        description: 'Main item name or "Multiple items from [Store]" if multiple'
      },
      items_list: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of item names if multiple items'
      },
      items_count: {
        type: 'number',
        description: 'Number of items in order'
      },
      return_deadline_days: {
        type: 'number',
        description: 'Number of days for return/exchange'
      },
      warranty_months: {
        type: 'number',
        description: 'Warranty period in months (0 if not mentioned)'
      },
      has_invoice_attachment: {
        type: 'boolean',
        description: 'True if invoice is mentioned to be attached'
      },
      confidence: {
        type: 'object',
        properties: {
          overall: {
            type: 'string',
            enum: ['high', 'medium', 'low']
          },
          merchant: { type: 'number' },
          amount: { type: 'number' },
          date: { type: 'number' },
          email_type: { type: 'number' }
        },
        required: ['overall', 'merchant', 'amount', 'date', 'email_type']
      },
      extraction_notes: {
        type: 'string',
        description: 'Brief notes about extraction reasoning or uncertainties'
      },
      needs_review: {
        type: 'boolean',
        description: 'True if extraction needs manual review'
      }
    },
    required: [
      'language',
      'email_type',
      'is_purchase',
      'merchant_name',
      'confidence',
      'needs_review',
      'has_invoice_attachment'
    ]
  }
}

/**
 * Extracts order data from email using Anthropic Claude
 */
export async function extractOrderData(
  options: ExtractionOptions
): Promise<ExtractionResult> {
  const { emailContent, subject, hasAttachment, attachmentType, maxRetries = 2, merchantHint } = options

  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })

  let retries = 0
  let lastError: string | undefined

  // Pre-analysis: Detect language and extract currency hints
  const detectedLanguage = detectEmailLanguage(emailContent)
  const amounts = extractAllAmounts(emailContent)
  const possibleTotal = findTotalAmount(emailContent, amounts)

  // Build context hints with merchant hint prominently displayed
  const contextHints = `
=== IMPORTANT CONTEXT ===
${merchantHint ? `🏪 MERCHANT HINT FROM SUBJECT: "${merchantHint}" - USE THIS AS THE MERCHANT NAME!` : ''}
- Detected language: ${detectedLanguage}
${possibleTotal ? `- Possible total found: ${possibleTotal.raw} (${possibleTotal.amount} ${possibleTotal.currency || 'unknown currency'})` : ''}
${amounts.length > 0 ? `- Found ${amounts.length} currency amounts in email` : ''}
${hasAttachment ? `- Email has attachment: ${attachmentType || 'unknown type'}` : '- No attachments'}
=== END CONTEXT ===
`

  while (retries <= maxRetries) {
    try {
      const retryWarning = retries > 0
        ? `⚠️ RETRY ${retries}: Previous extraction failed. The merchant was probably wrong.
REMEMBER: The merchant is the STORE that sold the item, NOT gmail/outlook/yahoo!
Look at the subject line: "${subject}" - the store name is usually there.
${merchantHint ? `USE THIS MERCHANT: "${merchantHint}"` : ''}

`
        : ''

      const userPrompt = `${retryWarning}Extract purchase information from this email:

Subject: ${subject}

${emailContent}

${contextHints}

Use the extract_order_data tool to return structured data.`

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929', // Claude 3.5 Sonnet (June 2024) - stable version
        max_tokens: 4096,
        tools: [EXTRACTION_TOOL],
        tool_choice: { type: 'tool', name: 'extract_order_data' },
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ],
        system: SYSTEM_PROMPT
      })

      // Extract tool use result
      const toolUse = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      )

      if (!toolUse || toolUse.name !== 'extract_order_data') {
        throw new Error('AI did not return expected tool use')
      }

      const extraction = toolUse.input as any

      // Post-process: Fix common AI mistakes

      // 1. If AI returned email provider as merchant, override with hint
      const emailProviders = ['gmail', 'outlook', 'yahoo', 'hotmail', 'icloud', 'live', 'mail', 'email', 'unknown']
      const merchantLower = (extraction.merchant_name || '').toLowerCase()
      if (emailProviders.some(p => merchantLower.includes(p))) {
        if (merchantHint) {
          console.log(`🔧 Overriding bad merchant "${extraction.merchant_name}" with hint "${merchantHint}"`)
          extraction.merchant_name = merchantHint
          extraction.extraction_notes = (extraction.extraction_notes || '') + ` [Auto-corrected merchant from subject line]`
          extraction.needs_review = true
        }
      }

      // 2. Validate and normalize currency
      if (extraction.total_amount && !extraction.currency && detectedLanguage) {
        extraction.currency = inferCurrency(detectedLanguage, emailContent)
      }

      // 3. If we still have no good merchant but have a hint, use it
      if ((!extraction.merchant_name || extraction.merchant_name.length < 2) && merchantHint) {
        extraction.merchant_name = merchantHint
        extraction.needs_review = true
      }

      // Validate with Zod - NEVER use strict mode (it causes loops)
      const validation = validateExtraction(extraction, false)

      if (!validation.success) {
        lastError = `Validation failed: ${validation.errors?.issues.map(i => i.message).join(', ')}`
        retries++
        continue
      }

      // Final check: Set needs_review flag
      const finalData = validation.data as OrderExtraction
      if (!finalData.needs_review) {
        finalData.needs_review = needsManualReview(finalData)
      }

      return {
        success: true,
        data: finalData,
        retries
      }
    } catch (error: any) {
      lastError = error.message || 'Unknown error during extraction'
      retries++

      if (retries > maxRetries) {
        break
      }
    }
  }

  return {
    success: false,
    error: lastError || 'Max retries exceeded',
    retries
  }
}

/**
 * Gets Anthropic API client (with error handling)
 */
export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY not configured in environment variables. Please add it to .env.local'
    )
  }

  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })
}
