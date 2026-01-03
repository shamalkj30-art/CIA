import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

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
    const openai = getOpenAIClient()
    let completion

    // Handle PDF - extract text and analyze with GPT
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

        // Analyze extracted text with GPT
        completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are an expert at extracting purchase information from receipt text. Analyze the receipt text and extract the following information if available:
- item_name: The main product or item purchased (be specific, combine multiple items if needed)
- merchant: The store or business name
- purchase_date: The purchase date in YYYY-MM-DD format
- warranty_months: Warranty period in months (if mentioned, otherwise null)
- total_amount: The total amount paid (number only, no currency symbol)
- currency: The currency code (USD, EUR, NOK, GBP, etc.)

Return a JSON object with these fields. If a field cannot be determined from the receipt, omit it or set to null.
Include a "confidence" field with value "high", "medium", or "low" based on how clearly the information is visible.
Include a "missing_fields" array listing fields that could not be extracted.

Only return valid JSON, no other text.`,
            },
            {
              role: 'user',
              content: `Extract purchase information from this receipt text:\n\n${pdfText}\n\nReturn only valid JSON.`,
            },
          ],
          max_tokens: 500,
        })
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
      // Handle images - use Vision API
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      
      // Determine correct MIME type
      let mimeType = file.type
      if (!mimeType || mimeType === 'application/octet-stream') {
        // Guess from extension
        if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) mimeType = 'image/jpeg'
        else if (fileName.endsWith('.png')) mimeType = 'image/png'
        else if (fileName.endsWith('.gif')) mimeType = 'image/gif'
        else if (fileName.endsWith('.webp')) mimeType = 'image/webp'
        else if (fileName.endsWith('.heic')) mimeType = 'image/heic'
        else mimeType = 'image/jpeg' // Default
      }
      
      const dataUrl = `data:${mimeType};base64,${base64}`

      completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting purchase information from receipts. Analyze the receipt image and extract the following information if available:
- item_name: The main product or item purchased (be specific, combine multiple items if needed)
- merchant: The store or business name
- purchase_date: The purchase date in YYYY-MM-DD format
- warranty_months: Warranty period in months (if mentioned, otherwise null)
- total_amount: The total amount paid (number only, no currency symbol)
- currency: The currency code (USD, EUR, NOK, GBP, etc.)

Return a JSON object with these fields. If a field cannot be determined from the receipt, omit it or set to null.
Include a "confidence" field with value "high", "medium", or "low" based on how clearly the information is visible.
Include a "missing_fields" array listing fields that could not be extracted.

Only return valid JSON, no other text.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract purchase information from this receipt. Return only valid JSON.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      })
    }

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'Failed to analyze receipt' }, { status: 500 })
    }

    // Parse JSON response
    let analysis: ReceiptAnalysis
    try {
      // Clean the response in case there's extra text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      analysis = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse AI response:', content)
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

    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error('Error analyzing receipt:', error)
    
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to analyze receipt' },
      { status: 500 }
    )
  }
}
