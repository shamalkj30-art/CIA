import type { Purchase, PurchaseWithDocuments } from './types'

export type ProofScore = 'ready' | 'almost_ready' | 'not_ready'
export type TrustLevel = 'high' | 'medium' | 'low' | 'manual'

export interface ProofScoreResult {
  score: ProofScore
  label: string
  description: string
  icon: string
  colorClass: string
  bgClass: string
  missingFields: string[]
  confidenceLevel: TrustLevel
  needsReview: boolean
}

interface EmailMetadataConfidence {
  overall?: 'high' | 'medium' | 'low'
  merchant?: number
  amount?: number
  date?: number
}

/**
 * Calculate proof score for a purchase based on available evidence
 * Used to determine if a purchase is "claim ready" for warranty/return cases
 */
export function calculateProofScore(
  purchase: Purchase | PurchaseWithDocuments
): ProofScoreResult {
  const documents = 'documents' in purchase ? purchase.documents : []

  const hasReceipt = documents.length > 0
  const hasMerchant = !!purchase.merchant
  const hasPrice = !!purchase.price
  const hasDate = !!purchase.purchase_date
  const hasOrderNumber = !!purchase.order_number

  // Get confidence from email_metadata
  const emailMetadata = purchase.email_metadata as { confidence?: EmailMetadataConfidence } | null
  const confidenceData = emailMetadata?.confidence

  let confidenceLevel: TrustLevel = 'low'
  if (purchase.source === 'manual') {
    confidenceLevel = 'manual'
  } else if (confidenceData?.overall) {
    confidenceLevel = confidenceData.overall
  }

  // Build list of missing critical fields
  const missingFields: string[] = []
  if (!hasReceipt) missingFields.push('Receipt')
  if (!hasMerchant) missingFields.push('Merchant')
  if (!hasPrice) missingFields.push('Price')
  if (!hasDate) missingFields.push('Date')

  // Calculate proof score
  if (hasReceipt && hasMerchant && hasPrice && hasDate) {
    return {
      score: 'ready',
      label: 'Claim Ready',
      description: 'All evidence available for warranty claims',
      icon: '✓',
      colorClass: 'text-green-600 dark:text-green-400',
      bgClass: 'bg-green-100 dark:bg-green-900/30',
      missingFields,
      confidenceLevel,
      needsReview: purchase.needs_review,
    }
  }

  if ((hasReceipt || hasMerchant) && hasPrice) {
    return {
      score: 'almost_ready',
      label: 'Almost Ready',
      description: `Missing: ${missingFields.join(', ')}`,
      icon: '◐',
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-100 dark:bg-amber-900/30',
      missingFields,
      confidenceLevel,
      needsReview: purchase.needs_review,
    }
  }

  return {
    score: 'not_ready',
    label: 'Missing Info',
    description: `Missing: ${missingFields.join(', ')}`,
    icon: '○',
    colorClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    missingFields,
    confidenceLevel,
    needsReview: purchase.needs_review,
  }
}

/**
 * Get field-level confidence for a specific field
 * Returns confidence score (0-1) and trust level
 */
export function getFieldConfidence(
  purchase: Purchase,
  fieldName: 'merchant' | 'amount' | 'date'
): { score: number; level: TrustLevel } {
  if (purchase.source === 'manual') {
    return { score: 1, level: 'manual' }
  }

  const emailMetadata = purchase.email_metadata as { confidence?: EmailMetadataConfidence } | null
  const confidence = emailMetadata?.confidence

  if (!confidence) {
    return { score: 0, level: 'low' }
  }

  const score = confidence[fieldName] ?? 0

  let level: TrustLevel = 'low'
  if (score >= 0.8) level = 'high'
  else if (score >= 0.5) level = 'medium'
  else level = 'low'

  return { score, level }
}

/**
 * Get trust indicator config for a field
 */
export function getTrustIndicatorConfig(level: TrustLevel): {
  label: string
  icon: string
  colorClass: string
  bgClass: string
} {
  switch (level) {
    case 'high':
      return {
        label: 'AI Verified',
        icon: '✓',
        colorClass: 'text-green-600 dark:text-green-400',
        bgClass: 'bg-green-100 dark:bg-green-900/30',
      }
    case 'medium':
      return {
        label: 'AI Detected',
        icon: '~',
        colorClass: 'text-amber-600 dark:text-amber-400',
        bgClass: 'bg-amber-100 dark:bg-amber-900/30',
      }
    case 'low':
      return {
        label: 'Low Confidence',
        icon: '?',
        colorClass: 'text-red-600 dark:text-red-400',
        bgClass: 'bg-red-100 dark:bg-red-900/30',
      }
    case 'manual':
      return {
        label: 'Manual Entry',
        icon: '•',
        colorClass: 'text-gray-600 dark:text-gray-400',
        bgClass: 'bg-gray-100 dark:bg-gray-800',
      }
  }
}
