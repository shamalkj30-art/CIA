// Extract text from PDF for AI analysis

export async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<string> {
  // Use unpdf for text extraction
  try {
    const { extractText } = await import('unpdf')
    const result = await extractText(new Uint8Array(pdfBuffer))
    // result.text is an array of strings (one per page)
    const fullText = Array.isArray(result.text) ? result.text.join('\n') : String(result.text || '')
    if (fullText && fullText.trim().length > 20) {
      return fullText
    }
  } catch (e) {
    console.log('PDF text extraction failed:', e)
  }

  throw new Error('Could not extract text from PDF. This might be a scanned/image-based PDF.')
}

// Check if PDF contains extractable text
export async function canExtractText(pdfBuffer: ArrayBuffer): Promise<boolean> {
  try {
    const text = await extractTextFromPdf(pdfBuffer)
    return text.trim().length > 20
  } catch {
    return false
  }
}
