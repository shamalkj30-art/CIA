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
}

interface ExtractionResult {
  success: boolean
  data?: OrderExtraction
  error?: string
  retries: number
}

/**
 * System prompt for email extraction
 */
const SYSTEM_PROMPT = `You are an expert multilingual email analyzer specializing in Nordic e-commerce order confirmations and receipts.

Your task is to extract structured purchase information from emails with MAXIMUM accuracy.

## LANGUAGE DETECTION
Detect the primary language of the email:
- Norwegian (no): "Takk for kjøpet", "bestilling", "ordrenummer", "kr", "NOK", "angrerett", "dager"
- English (en): "Thank you", "order", "purchase", "confirmation", "total"
- Swedish (sv): "Tack för", "beställning", "ordernummer", "kronor"
- Danish (da): "Tak for", "bestilling", "bekræftelse"
- German (de): "Danke", "Bestellung", "Rechnung"
- Other: If none of the above match

## EMAIL TYPE CLASSIFICATION
Classify the email into ONE of these types:
- order_confirmation: Order placed, items confirmed, payment confirmed ("Order confirmed", "Takk for kjøpet", "Bestellbestätigung")
- payment_receipt: Payment processed ("Payment accepted", "Receipt", "Kvittering")
- shipping_confirmation: Order shipped/dispatched ("Shipped", "On its way", "Sendt", "Försändelse")
- delivery_confirmation: Order delivered ("Delivered", "Levert")
- invoice: Invoice document ("Invoice", "Faktura", "Rechnung")
- thank_you: Generic thank you without details ("Thank you for shopping")
- unknown: Cannot determine type

## MERCHANT EXTRACTION (CRITICAL)
The merchant is the STORE/BRAND that sold the product, NOT the email provider.

CORRECT merchant names:
- "Zara" (clothing retailer)
- "Mango" (clothing retailer)
- "Lumibeauty" (beauty products)
- "Elkjøp" (electronics)
- "IKEA" (furniture)

NEVER use these as merchant names:
- ❌ "gmail", "outlook", "hotmail", "yahoo" (email providers)
- ❌ "email", "mail", "post" (generic terms)
- ❌ "unknown" (unless you genuinely cannot find ANY merchant indicator)

How to find the merchant:
1. Look for brand names in the email header/logo
2. Check the email subject line for store names
3. Look for phrases like "Thank you for shopping with [Brand]"
4. Check sender display name (but NOT the email domain)
5. Look for website URLs (zara.com → "Zara")

## AMOUNT & CURRENCY EXTRACTION (CRITICAL)
Locate the FINAL TOTAL amount paid by the customer.

Common table headers/labels to look for:
- Norwegian: "Totalt", "Sum", "Til sammen", "Delsum", "Beløp"
- English: "Total", "Amount", "Grand Total", "Order Total"
- Swedish: "Totalt", "Summa"
- German: "Gesamt", "Summe"

Currency formats to handle:
- Norwegian: "kr 1.217,00" or "1 217 kr" or "1.217,00 NOK" → 1217.00 NOK
- European: "86,98 €" or "EUR 86,98" → 86.98 EUR
- US: "$1,234.56" or "1234.56 USD" → 1234.56 USD
- Generic: "1,435.00 NOK" → 1435.00 NOK

IMPORTANT number format rules:
- European format uses COMMA for decimals: "1.217,00" = 1217.00
- US format uses DOT for decimals: "1,217.00" = 1217.00
- Spaces can be thousands separators: "1 217" = 1217

Extract the LARGEST amount labeled as "total", not individual item prices.

## RETURN POLICY EXTRACTION
Look for return/exchange deadlines:
- Norwegian: "14 dager", "30 dagers angrerett", "retur innen"
- English: "14 days to return", "30-day return policy"
- Swedish: "14 dagars returrätt"
- Common values: 14, 30, 60, 90 days

## WARRANTY EXTRACTION
Most order confirmations DON'T include warranty info - that's normal.
Only set warranty_months if explicitly mentioned:
- "2 år garanti" → 24 months
- "1 year warranty" → 12 months
- If not mentioned → 0 months

## CONFIDENCE SCORING
Score each field 0.0 to 1.0:
- merchant: 1.0 = certain (saw logo/brand name), 0.5 = guessed from context, 0.2 = very uncertain
- amount: 1.0 = found in "Total" row, 0.7 = found number but no label, 0.3 = guessed
- date: 1.0 = explicit date in email, 0.8 = inferred from email timestamp
- email_type: 1.0 = clear indicator, 0.5 = ambiguous

Overall confidence:
- high: All critical fields found with certainty
- medium: Some fields uncertain or missing
- low: Significant gaps or uncertainty

## ANTI-HALLUCINATION RULES
1. If you cannot find a field, set it to null - NEVER guess
2. If you cannot determine email type, use "unknown"
3. If merchant is unclear, provide your best guess but set low confidence
4. Never invent order numbers, tracking numbers, or amounts
5. If multiple possible amounts, choose the one labeled "total" or the largest

## OUTPUT REQUIREMENTS
Always return complete, valid JSON matching the schema.
Set needs_review: true if confidence is low or critical fields are missing.
Provide brief extraction_notes explaining your reasoning for uncertain fields.`

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
  const { emailContent, subject, hasAttachment, attachmentType, maxRetries = 2 } = options

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

  const contextHints = `
CONTEXT HINTS (to help you):
- Detected language: ${detectedLanguage}
${possibleTotal ? `- Possible total found: ${possibleTotal.raw} (${possibleTotal.amount} ${possibleTotal.currency || 'unknown currency'})` : ''}
${amounts.length > 0 ? `- Found ${amounts.length} currency amounts in email` : ''}
${hasAttachment ? `- Email has attachment: ${attachmentType || 'unknown type'}` : '- No attachments'}
`

  while (retries <= maxRetries) {
    try {
      const userPrompt = `${retries > 0 ? '⚠️ RETRY ' + retries + ': Previous extraction had validation errors. Be more careful.\n\n' : ''}Extract purchase information from this email:

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

      // Post-process: Validate and normalize currency
      if (extraction.total_amount && !extraction.currency && detectedLanguage) {
        extraction.currency = inferCurrency(detectedLanguage, emailContent)
      }

      // Validate with Zod
      const validation = validateExtraction(extraction, retries > 0)

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
