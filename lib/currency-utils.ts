/**
 * Currency Utilities - Normalize multilingual currency formats
 * Handles Norwegian, European, and US formats
 */

export interface NormalizedAmount {
  amount: number | null
  currency: string | null
  confidence: number // 0-1
  raw: string
}

/**
 * Normalizes currency amounts from various formats to a standard number
 *
 * Examples:
 * - "kr 1.217,00" → { amount: 1217.00, currency: "NOK" }
 * - "1 217 kr" → { amount: 1217.00, currency: "NOK" }
 * - "€86,98" → { amount: 86.98, currency: "EUR" }
 * - "$1,234.56" → { amount: 1234.56, currency: "USD" }
 * - "1,435.00 NOK" → { amount: 1435.00, currency: "NOK" }
 */
export function normalizeCurrency(text: string): NormalizedAmount {
  if (!text) {
    return { amount: null, currency: null, confidence: 0, raw: text }
  }

  const cleanText = text.trim()

  // Try each pattern in order of specificity
  const patterns = [
    // Norwegian kroner: "kr 1.217,00" or "1.217,00 kr" or "1 217 kr"
    {
      regex: /(?:kr\s*)?([\d\s.]+),(\d{2})(?:\s*kr)?/i,
      currency: 'NOK',
      parser: (match: RegExpMatchArray) => {
        const wholePart = match[1].replace(/[\s.]/g, '') // Remove spaces and dots (thousands sep)
        const decimalPart = match[2]
        return parseFloat(`${wholePart}.${decimalPart}`)
      }
    },

    // Euro: "€86,98" or "86,98 €" or "EUR 86,98"
    {
      regex: /(?:€|EUR)\s*([\d\s.]+),(\d{2})|(\d[\d\s.]+),(\d{2})\s*(?:€|EUR)/i,
      currency: 'EUR',
      parser: (match: RegExpMatchArray) => {
        const wholePart = (match[1] || match[3] || '').replace(/[\s.]/g, '')
        const decimalPart = match[2] || match[4]
        return parseFloat(`${wholePart}.${decimalPart}`)
      }
    },

    // USD: "$1,234.56" or "1234.56 USD"
    {
      regex: /(?:\$|USD)\s*([\d,]+)\.(\d{2})|([\d,]+)\.(\d{2})\s*(?:\$|USD)/i,
      currency: 'USD',
      parser: (match: RegExpMatchArray) => {
        const wholePart = (match[1] || match[3] || '').replace(/,/g, '') // Remove commas
        const decimalPart = match[2] || match[4]
        return parseFloat(`${wholePart}.${decimalPart}`)
      }
    },

    // Generic with currency code: "1,435.00 NOK" (US format with code)
    {
      regex: /([\d,]+)\.(\d{2})\s*(NOK|SEK|DKK|GBP|CHF)/i,
      currency: null, // Will be extracted from match
      parser: (match: RegExpMatchArray) => {
        const wholePart = match[1].replace(/,/g, '')
        const decimalPart = match[2]
        return parseFloat(`${wholePart}.${decimalPart}`)
      }
    },

    // Generic with currency code: "1.435,00 NOK" (EU format with code)
    {
      regex: /([\d.]+),(\d{2})\s*(NOK|SEK|DKK|EUR|GBP)/i,
      currency: null,
      parser: (match: RegExpMatchArray) => {
        const wholePart = match[1].replace(/\./g, '')
        const decimalPart = match[2]
        return parseFloat(`${wholePart}.${decimalPart}`)
      }
    },

    // Fallback: Just a number with 2 decimals
    {
      regex: /(\d[\d\s.,]+)\.(\d{2})/,
      currency: null,
      parser: (match: RegExpMatchArray) => {
        const wholePart = match[1].replace(/[\s,]/g, '')
        const decimalPart = match[2]
        return parseFloat(`${wholePart}.${decimalPart}`)
      }
    }
  ]

  for (const pattern of patterns) {
    const match = cleanText.match(pattern.regex)
    if (match) {
      try {
        const amount = pattern.parser(match)
        let currency = pattern.currency || (match[3] || match[match.length - 1])?.toUpperCase()

        // Confidence based on currency detection and amount validity
        let confidence = 0.5
        if (currency) confidence += 0.3
        if (amount > 0 && amount < 1000000) confidence += 0.2

        return {
          amount: isNaN(amount) ? null : amount,
          currency: currency || null,
          confidence,
          raw: cleanText
        }
      } catch (e) {
        continue
      }
    }
  }

  // No match found
  return {
    amount: null,
    currency: null,
    confidence: 0,
    raw: cleanText
  }
}

/**
 * Extracts all currency amounts from a text block
 * Useful for finding prices in tables or scattered text
 */
export function extractAllAmounts(text: string): NormalizedAmount[] {
  const amounts: NormalizedAmount[] = []

  // Split by newlines and process each line
  const lines = text.split('\n')

  for (const line of lines) {
    // Look for common price indicators
    if (
      /total|sum|beløp|totalt|delsum|amount|price|pris/i.test(line) ||
      /kr|€|\$|NOK|EUR|USD/i.test(line)
    ) {
      const normalized = normalizeCurrency(line)
      if (normalized.amount !== null) {
        amounts.push(normalized)
      }
    }
  }

  return amounts
}

/**
 * Finds the most likely "total" amount from a list of amounts
 * Prefers amounts with "total", "sum", etc. in the same line
 */
export function findTotalAmount(text: string, amounts: NormalizedAmount[]): NormalizedAmount | null {
  if (amounts.length === 0) return null

  const lines = text.split('\n')

  // First pass: Look for explicit "total" lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()
    if (
      /totalt|total|sum|til\s+sammen|amount\s+due|grand\s+total/i.test(line)
    ) {
      // Find amount in this line or next line
      const normalized = normalizeCurrency(lines[i])
      if (normalized.amount !== null) {
        return { ...normalized, confidence: Math.min(1.0, normalized.confidence + 0.2) }
      }
      if (i + 1 < lines.length) {
        const nextNormalized = normalizeCurrency(lines[i + 1])
        if (nextNormalized.amount !== null) {
          return { ...nextNormalized, confidence: Math.min(1.0, nextNormalized.confidence + 0.2) }
        }
      }
    }
  }

  // Second pass: Return the largest amount (usually the total)
  const sorted = [...amounts].sort((a, b) => (b.amount || 0) - (a.amount || 0))
  return sorted[0] || null
}

/**
 * Infers currency from language/context if not explicitly stated
 */
export function inferCurrency(language: string, text: string): string | null {
  const lower = text.toLowerCase()

  // Explicit currency mentions
  if (/\bNOK\b|kroner|norsk/.test(text)) return 'NOK'
  if (/\bEUR\b|euro|€/.test(text)) return 'EUR'
  if (/\bUSD\b|dollar|\$/.test(text)) return 'USD'
  if (/\bSEK\b|kronor|svensk/.test(text)) return 'SEK'
  if (/\bDKK\b|danske/.test(text)) return 'DKK'
  if (/\bGBP\b|pound|£/.test(text)) return 'GBP'

  // Infer from language
  switch (language) {
    case 'no':
      return 'NOK'
    case 'sv':
      return 'SEK'
    case 'da':
      return 'DKK'
    case 'en':
      // Check for .co.uk, .eu domains or other hints
      if (/\.co\.uk|\.uk/i.test(text)) return 'GBP'
      if (/\.eu|europa/i.test(text)) return 'EUR'
      return null // Could be USD, GBP, EUR - can't determine
    default:
      return null
  }
}

/**
 * Formats a currency amount for display
 */
export function formatCurrency(amount: number, currency: string): string {
  const formatters: Record<string, Intl.NumberFormat> = {
    NOK: new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK' }),
    EUR: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    SEK: new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }),
    DKK: new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }),
    GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })
  }

  const formatter = formatters[currency]
  return formatter ? formatter.format(amount) : `${currency} ${amount.toFixed(2)}`
}
