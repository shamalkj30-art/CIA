/**
 * Manual Receipt Upload Analysis
 * Uses LLM abstraction layer for consistent, high-quality extraction
 * Supports switching between Anthropic, OpenAI, or Google via LLM_PROVIDER env var
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getLLMProvider } from '@/lib/llm'

interface ReceiptAnalysis {
  item_name?: string
  merchant?: string
  purchase_date?: string
  warranty_months?: number
  total_amount?: number
  currency?: string
  confidence: 'high' | 'medium' | 'low'
  missing_fields: string[]
}

// Force Node.js runtime for PDF processing
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type - accept common receipt formats
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/heic',
      'image/heif',
      'application/pdf',
      'image/tiff',
      'image/bmp'
    ]

    // Also check by extension for better compatibility
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.heic', '.tiff', '.bmp'].some(
      ext => fileName.endsWith(ext)
    )

    if (!allowedTypes.includes(file.type) && !hasValidExtension) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF, PDF, HEIC, TIFF, BMP' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const llm = getLLMProvider()
    let responseContent: string

    // Handle PDF - extract text and analyze with LLM
    const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf')

    if (isPdf) {
      try {
        const { extractTextFromPdf } = await import('@/lib/pdf-to-image')
        const pdfText = await extractTextFromPdf(arrayBuffer)

        console.log('Extracted PDF text length:', pdfText.length)

        if (!pdfText || pdfText.trim().length < 10) {
          return NextResponse.json(
            {
              error: 'Could not extract readable text from this PDF. It appears to be a scanned or image-based PDF. Please take a screenshot of the PDF and upload that instead.',
              suggestion: 'Try: Open the PDF → Take a screenshot → Upload the screenshot'
            },
            { status: 400 }
          )
        }

        // Analyze extracted text with LLM (text-only)
        const pdfPrompt = `Extract purchase information from this receipt text and return ONLY valid JSON.

Receipt text:
${pdfText}

Return a JSON object with these fields:
- item_name: Main product/item purchased (combine multiple if needed)
- merchant: Store/business name
- purchase_date: Date in YYYY-MM-DD format
- warranty_months: Warranty period in months (if mentioned, otherwise null)
- total_amount: Total amount paid (number only, no currency symbol)
- currency: Currency code (USD, EUR, NOK, GBP, etc.)
- confidence: "high", "medium", or "low"
- missing_fields: Array of fields that couldn't be extracted

Example:
{
  "item_name": "MacBook Pro 14-inch",
  "merchant": "Apple Store",
  "purchase_date": "2024-01-15",
  "warranty_months": 12,
  "total_amount": 1999.00,
  "currency": "USD",
  "confidence": "high",
  "missing_fields": []
}

Return ONLY the JSON object, no other text.`

        const response = await llm.chat(
          [{ role: 'user', content: pdfPrompt }],
          { maxTokens: 1024 }
        )
        responseContent = response.content
      } catch (pdfError: any) {
        console.error('PDF processing error:', pdfError)
        return NextResponse.json(
          {
            error: pdfError.message || 'Failed to process PDF. Please take a screenshot and upload the image instead.',
            suggestion: 'This PDF might be image-based. Try taking a screenshot and uploading that.'
          },
          { status: 400 }
        )
      }
    } else {
      // Handle images - use LLM Vision API
      const base64 = Buffer.from(arrayBuffer).toString('base64')

      // Determine correct MIME type
      let mimeType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg'

      if (file.type === 'image/png' || fileName.endsWith('.png')) {
        mimeType = 'image/png'
      } else if (file.type === 'image/gif' || fileName.endsWith('.gif')) {
        mimeType = 'image/gif'
      } else if (file.type === 'image/webp' || fileName.endsWith('.webp')) {
        mimeType = 'image/webp'
      }
      // HEIC, TIFF, BMP need conversion - for now treat as JPEG

      const visionPrompt = `Analyze this receipt image and extract purchase information. Return ONLY valid JSON.

Return a JSON object with these fields:
- item_name: Main product/item purchased (be specific, combine multiple items if needed)
- merchant: Store/business name (NOT the email domain)
- purchase_date: Purchase date in YYYY-MM-DD format
- warranty_months: Warranty period in months (if mentioned, otherwise null)
- total_amount: Total amount paid (number only, no currency symbol)
- currency: Currency code (USD, EUR, NOK, GBP, etc.)
- confidence: "high", "medium", or "low" based on how clear the receipt is
- missing_fields: Array of field names that couldn't be extracted

Example:
{
  "item_name": "MacBook Pro 14-inch",
  "merchant": "Apple Store",
  "purchase_date": "2024-01-15",
  "warranty_months": 12,
  "total_amount": 1999.00,
  "currency": "USD",
  "confidence": "high",
  "missing_fields": []
}

IMPORTANT:
- For Norwegian receipts: "kr" or "NOK" = Norwegian Kroner
- Extract the TOTAL amount, not individual items
- If multiple items, list the main one or say "Multiple items from [Store]"

Return ONLY the JSON object, no other text.`

      responseContent = await llm.vision(base64, mimeType, visionPrompt, { maxTokens: 1024 })
    }

    if (!responseContent) {
      return NextResponse.json({ error: 'Failed to analyze receipt' }, { status: 500 })
    }

    // Parse JSON response
    let analysis: ReceiptAnalysis
    try {
      // Clean the response in case there's extra text
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      analysis = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseContent)
      return NextResponse.json({ error: 'Failed to parse receipt analysis' }, { status: 500 })
    }

    // Ensure required fields
    analysis.confidence = analysis.confidence || 'low'
    analysis.missing_fields = analysis.missing_fields || []

    // Calculate missing fields if not provided
    if (!analysis.missing_fields.length) {
      const allFields = ['item_name', 'merchant', 'purchase_date', 'warranty_months']
      analysis.missing_fields = allFields.filter(
        (field) => !analysis[field as keyof ReceiptAnalysis]
      )
    }

    console.log('Receipt analysis complete:', analysis)

    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error('Error analyzing receipt:', error)

    if (error.message?.includes('API key') || error.message?.includes('configured')) {
      return NextResponse.json(
        { error: 'LLM API key not configured. Please add the appropriate API key (ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_AI_API_KEY) to your environment variables.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to analyze receipt' },
      { status: 500 }
    )
  }
}
