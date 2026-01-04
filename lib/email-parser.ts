/**
 * Email HTML Parser - Intelligently converts HTML emails to structured text
 * while preserving important layout like tables, prices, and hierarchies.
 */

interface ParsedEmail {
  text: string
  hasStructuredData: boolean
  extractedTables: Array<{ headers: string[]; rows: string[][] }>
}

/**
 * Converts HTML email to clean, structured text while preserving tables
 * and important formatting that helps AI extract purchase data.
 */
export function parseEmailHtml(html: string): ParsedEmail {
  if (!html) {
    return { text: '', hasStructuredData: false, extractedTables: [] }
  }

  let processed = html

  // Step 1: Extract and convert tables to readable text format BEFORE stripping tags
  const tables: Array<{ headers: string[]; rows: string[][] }> = []
  processed = processed.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match, tableContent) => {
    const tableText = parseHtmlTable(tableContent)
    tables.push(tableText)

    // Convert table to readable text format
    let textRepresentation = '\n=== TABLE ===\n'

    if (tableText.headers.length > 0) {
      textRepresentation += tableText.headers.join(' | ') + '\n'
      textRepresentation += '-'.repeat(50) + '\n'
    }

    tableText.rows.forEach(row => {
      textRepresentation += row.join(' | ') + '\n'
    })

    textRepresentation += '=== END TABLE ===\n'

    return textRepresentation
  })

  // Step 2: Convert common formatting to readable text
  processed = processed
    // Preserve line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')

    // Remove style and script tags completely
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')

    // Remove all remaining HTML tags but keep the content
    .replace(/<[^>]+>/g, ' ')

    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&euro;/g, '€')

    // Clean up excessive whitespace while preserving structure
    .replace(/[ \t]+/g, ' ') // Multiple spaces/tabs → single space
    .replace(/\n\s+\n/g, '\n\n') // Clean up blank lines with whitespace
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .trim()

  return {
    text: processed,
    hasStructuredData: tables.length > 0,
    extractedTables: tables
  }
}

/**
 * Parses an HTML table into structured data
 */
function parseHtmlTable(tableHtml: string): { headers: string[]; rows: string[][] } {
  const headers: string[] = []
  const rows: string[][] = []

  // Extract headers from <thead> or first <tr>
  const theadMatch = tableHtml.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i)
  if (theadMatch) {
    const headerCells = theadMatch[1].match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || []
    headerCells.forEach(cell => {
      const text = stripHtmlTags(cell).trim()
      if (text) headers.push(text)
    })
  }

  // Extract rows from <tbody> or all <tr>
  const rowMatches = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || []

  rowMatches.forEach((rowHtml, index) => {
    // Skip first row if we already got headers
    if (index === 0 && headers.length > 0) return

    const cellMatches = rowHtml.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || []
    const rowData: string[] = []

    cellMatches.forEach(cell => {
      const text = stripHtmlTags(cell).trim()
      rowData.push(text)
    })

    if (rowData.length > 0 && rowData.some(cell => cell.length > 0)) {
      // If this is first row and no headers yet, treat as headers
      if (rows.length === 0 && headers.length === 0) {
        headers.push(...rowData)
      } else {
        rows.push(rowData)
      }
    }
  })

  return { headers, rows }
}

/**
 * Strips HTML tags from a string
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&euro;/g, '€')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extracts potential currency amounts from text
 * Useful for quick scanning to see if email contains prices
 */
export function extractAmountsFromText(text: string): Array<{
  raw: string
  amount: number | null
  currency: string | null
}> {
  const amounts: Array<{ raw: string; amount: number | null; currency: string | null }> = []

  // Patterns for common currency formats
  const patterns = [
    // Norwegian: "kr 1.217,00" or "1 217 kr" or "1.217,00 kr"
    /(?:kr\s*)?([\d\s.]+,\d{2})(?:\s*kr)?/gi,
    // Euro: "€86.98" or "86,98 €" or "86.98 EUR"
    /(?:€|EUR)\s*([\d\s.,]+)|(\d[\d\s.,]+)\s*(?:€|EUR)/gi,
    // USD: "$1,234.56" or "1234.56 USD"
    /(?:\$|USD)\s*([\d\s.,]+)|(\d[\d\s.,]+)\s*(?:\$|USD)/gi,
    // Generic number with currency code: "1234.56 NOK"
    /([\d\s.,]+)\s*(NOK|SEK|DKK|GBP|CHF)/gi
  ]

  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      amounts.push({
        raw: match[0],
        amount: null,
        currency: null
      })
    }
  })

  return amounts
}

/**
 * Detects the likely language of an email
 */
export function detectEmailLanguage(text: string): 'no' | 'en' | 'sv' | 'da' | 'other' {
  const lower = text.toLowerCase()

  // Norwegian indicators
  const norwegianIndicators = [
    'takk for',
    'bestilling',
    'ordrenummer',
    'bekreftelse',
    'levering',
    'forsendelse',
    'totalt',
    'delsum',
    'angrerett',
    'dager',
    'kjøpet'
  ]

  // English indicators
  const englishIndicators = [
    'thank you',
    'order',
    'confirmation',
    'purchase',
    'total',
    'shipping',
    'delivery',
    'receipt'
  ]

  // Swedish indicators
  const swedishIndicators = [
    'tack för',
    'beställning',
    'ordernummer',
    'bekräftelse',
    'leverans',
    'totalt',
    'frakt'
  ]

  // Danish indicators
  const danishIndicators = [
    'tak for',
    'bestilling',
    'ordrenummer',
    'bekræftelse',
    'levering',
    'total',
    'forsendelse'
  ]

  const noScore = norwegianIndicators.filter(word => lower.includes(word)).length
  const enScore = englishIndicators.filter(word => lower.includes(word)).length
  const svScore = swedishIndicators.filter(word => lower.includes(word)).length
  const daScore = danishIndicators.filter(word => lower.includes(word)).length

  const maxScore = Math.max(noScore, enScore, svScore, daScore)

  if (maxScore === 0) return 'other'
  if (noScore === maxScore) return 'no'
  if (enScore === maxScore) return 'en'
  if (svScore === maxScore) return 'sv'
  if (daScore === maxScore) return 'da'

  return 'other'
}
