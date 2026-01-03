import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/upload - Upload a file to storage
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

    // Check by extension for better compatibility
    const fileName = file.name.toLowerCase()
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.heic', '.heif', '.tiff', '.tif', '.bmp']
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext))
    
    // Also check MIME types
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'image/gif', 
      'image/heic',
      'image/heif',
      'image/tiff',
      'image/bmp',
      'application/pdf',
      'application/octet-stream', // Sometimes HEIC files come as this
    ]
    
    if (!allowedTypes.includes(file.type) && !hasValidExtension) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF, PDF, HEIC, TIFF, BMP' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    // Generate unique file path: user_id/timestamp_filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `${user.id}/${timestamp}_${sanitizedName}`

    // Determine content type for upload
    // For HEIC files, we'll store them with a generic type to avoid Supabase restrictions
    let contentType = file.type
    
    // Handle HEIC/HEIF - use octet-stream as fallback since some storage systems don't support HEIC MIME
    if (file.type === 'image/heic' || file.type === 'image/heif' || 
        fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
      contentType = 'application/octet-stream'
    }
    
    // If no MIME type, detect from extension
    if (!contentType || contentType === 'application/octet-stream') {
      if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
        contentType = 'image/jpeg'
      } else if (fileName.endsWith('.png')) {
        contentType = 'image/png'
      } else if (fileName.endsWith('.pdf')) {
        contentType = 'application/pdf'
      } else if (fileName.endsWith('.webp')) {
        contentType = 'image/webp'
      } else if (fileName.endsWith('.gif')) {
        contentType = 'image/gif'
      } else if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
        // Store as generic binary since HEIC might not be supported by storage
        contentType = 'application/octet-stream'
      }
    }

    // Convert file to buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(storagePath, buffer, {
        contentType: contentType || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Return the original file type for display purposes
    return NextResponse.json({
      storage_path: storagePath,
      file_name: file.name,
      file_type: file.type || contentType,
      file_size: file.size,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
