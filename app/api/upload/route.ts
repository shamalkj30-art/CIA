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

    // Validate file type - accept common receipt formats
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'image/gif', 
      'image/heic',
      'image/heif',
      'image/tiff',
      'image/bmp',
      'application/pdf'
    ]
    
    // Also check by extension for better compatibility
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.heic', '.heif', '.tiff', '.tif', '.bmp'].some(
      ext => fileName.endsWith(ext)
    )
    
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

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    return NextResponse.json({
      storage_path: storagePath,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    })
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

