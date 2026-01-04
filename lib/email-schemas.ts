/**
 * Zod Validation Schemas for Email Extraction
 * Ensures AI outputs conform to expected structure
 */

import { z } from 'zod'

/**
 * Email type classification
 */
export const EmailTypeSchema = z.enum([
  'order_confirmation',
  'payment_receipt',
  'shipping_confirmation',
  'delivery_confirmation',
  'refund',
  'invoice',
  'thank_you',
  'unknown'
])

export type EmailType = z.infer<typeof EmailTypeSchema>

/**
 * Language detection
 */
export const LanguageSchema = z.enum(['no', 'en', 'sv', 'da', 'de', 'fr', 'other'])

export type Language = z.infer<typeof LanguageSchema>

/**
 * Merchant category classification
 */
export const MerchantCategorySchema = z.enum([
  'apparel',
  'beauty',
  'electronics',
  'groceries',
  'home',
  'travel',
  'subscriptions',
  'entertainment',
  'health',
  'other'
])

export type MerchantCategory = z.infer<typeof MerchantCategorySchema>

/**
 * Confidence scores for individual fields
 */
export const ConfidenceScoresSchema = z.object({
  overall: z.enum(['high', 'medium', 'low']),
  merchant: z.number().min(0).max(1),
  amount: z.number().min(0).max(1),
  date: z.number().min(0).max(1),
  email_type: z.number().min(0).max(1)
})

export type ConfidenceScores = z.infer<typeof ConfidenceScoresSchema>

/**
 * Main extraction schema - what AI must return
 */
export const OrderExtractionSchema = z.object({
  // Core classification
  language: LanguageSchema,
  email_type: EmailTypeSchema,
  is_purchase: z.boolean(),

  // Merchant info
  merchant_name: z.string().min(1),
  merchant_category: MerchantCategorySchema.nullish(),
  merchant_website: z.preprocess(
    (val) => (!val || val === '' ? null : val),
    z.string().url().nullish()
  ),

  // Order details
  order_number: z.string().nullish(),
  purchase_date: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.null(),
    z.undefined()
  ]).nullish(), // YYYY-MM-DD

  // Financial
  total_amount: z.number().positive().nullish(),
  currency: z.union([
    z.string().length(3),
    z.null(),
    z.undefined()
  ]).nullish(), // ISO 4217
  subtotal: z.number().positive().nullish(),
  tax: z.number().nullish(),
  shipping: z.number().nullish(),
  discount: z.number().nullish(),

  // Items
  item_name: z.string().nullish(), // Single item or summary like "Multiple items from Zara"
  items_list: z.array(z.string()).nullish(),
  items_count: z.number().int().positive().nullish(),

  // Return/warranty info
  return_deadline_days: z.number().int().nonnegative().nullish(),
  warranty_months: z.number().int().nonnegative().nullish(),

  // Delivery info
  estimated_delivery_date: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.null(),
    z.undefined()
  ]).nullish(),
  tracking_number: z.string().nullish(),

  // Invoice attachment
  has_invoice_attachment: z.boolean(),

  // Confidence and notes
  confidence: ConfidenceScoresSchema,
  extraction_notes: z.string().nullish(), // AI's reasoning
  needs_review: z.boolean(), // Flag for manual review

  // Raw data for debugging
  raw_merchant_text: z.string().nullish() // What AI saw as merchant
})

export type OrderExtraction = z.infer<typeof OrderExtractionSchema>

/**
 * Strict schema - DEPRECATED, kept for backwards compatibility
 * Using strict mode caused retry loops, so we now always use the base schema
 */
export const StrictOrderExtractionSchema = OrderExtractionSchema

export type StrictOrderExtraction = z.infer<typeof StrictOrderExtractionSchema>

/**
 * Validates extraction result
 * Note: strict parameter is ignored - always uses base schema
 */
export function validateExtraction(data: unknown, _strict: boolean = false): {
  success: boolean
  data?: OrderExtraction
  errors?: z.ZodError
} {
  // Always use base schema - strict mode caused infinite retry loops
  const result = OrderExtractionSchema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, errors: result.error }
  }
}

/**
 * Type guard to check if extraction is purchase-related
 */
export function isPurchaseEmail(extraction: OrderExtraction): boolean {
  return (
    extraction.is_purchase &&
    extraction.email_type !== 'unknown' &&
    extraction.merchant_name.length > 1
  )
}

/**
 * Determines if extraction needs manual review
 */
export function needsManualReview(extraction: OrderExtraction): boolean {
  if (extraction.needs_review) return true
  if (extraction.confidence.overall === 'low') return true
  if (extraction.confidence.merchant < 0.5) return true
  if (extraction.total_amount === null && extraction.email_type === 'order_confirmation') return true

  return false
}
