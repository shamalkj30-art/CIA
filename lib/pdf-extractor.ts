/**
 * PDF Text Extraction for Invoice Attachments
 * Extracts text from PDF invoices to improve AI extraction accuracy
 */

export interface PdfExtractionResult {
  text: string
  numPages: number
  success: boolean
  error?: string
}

/**
 * Extracts text from a PDF buffer
 */
export async function extractPdfText(buffer: Buffer): Promise<PdfExtractionResult> {
  try {
    // Dynamic import for CommonJS compatibility
    const pdfParse = (await import('pdf-parse')).default

    const data = await pdfParse(buffer, {
      // Preserve layout to keep table structure
      max: 0 // No page limit
    })

    return {
      text: data.text || '',
      numPages: data.numpages || 0,
      success: true
    }
  } catch (error: any) {
    return {
      text: '',
      numPages: 0,
      success: false,
      error: error.message || 'PDF parsing failed'
    }
  }
}

/**
 * Cleans extracted PDF text for better AI parsing
 */
export function cleanPdfText(text: string): string {
  return (
    text
      // Remove excessive whitespace
      .replace(/[ \t]+/g, ' ')
      // Normalize line breaks (max 2 consecutive)
      .replace(/\n{3,}/g, '\n\n')
      // Remove common PDF artifacts
      .replace(/\f/g, '\n') // Form feed
      .replace(/\r/g, '') // Carriage return
      .trim()
  )
}

/**
 * Extracts text from PDF attachment if present
 */
export async function extractTextFromAttachment(
  attachment: any
): Promise<string | null> {
  try {
    // Check if attachment is PDF
    const contentType = attachment.content_type || attachment.contentType || attachment.type || ''

    if (!contentType.includes('pdf')) {
      return null
    }

    // Get attachment data
    const attachmentData = attachment.content || attachment.data
    if (!attachmentData) {
      return null
    }

    // Convert base64 to buffer if needed
    let buffer: Buffer
    if (typeof attachmentData === 'string') {
      buffer = Buffer.from(attachmentData, 'base64')
    } else if (Buffer.isBuffer(attachmentData)) {
      buffer = attachmentData
    } else {
      return null
    }

    // Extract text
    const result = await extractPdfText(buffer)

    if (!result.success) {
      console.warn('PDF extraction failed:', result.error)
      return null
    }

    return cleanPdfText(result.text)
  } catch (error) {
    console.error('Error extracting PDF text:', error)
    return null
  }
}
