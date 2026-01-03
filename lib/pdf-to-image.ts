// Extract text from PDF for AI analysis
// Uses multiple methods for best compatibility

export async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<string> {
  // Try unpdf first (better for complex PDFs)
  try {
    const { extractText } = await import('unpdf')
    const { text } = await extractText(new Uint8Array(pdfBuffer))
    if (text && text.trim().length > 20) {
      return text
    }
  } catch (e) {
    console.log('unpdf extraction failed, trying pdf-parse...')
  }

  // Fallback to pdf-parse
  try {
    const pdfParse = (await import('pdf-parse')).default
    const buffer = Buffer.from(pdfBuffer)
    const data = await pdfParse(buffer)
    if (data.text && data.text.trim().length > 20) {
      return data.text
    }
  } catch (e) {
    console.log('pdf-parse extraction failed')
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
