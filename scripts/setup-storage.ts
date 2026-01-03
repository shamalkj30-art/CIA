// Run this script to set up the storage bucket
// Usage: npx ts-node scripts/setup-storage.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupStorage() {
  console.log('🚀 Setting up Cyncro storage...\n')

  // 1. Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    console.error('❌ Failed to list buckets:', listError.message)
    process.exit(1)
  }

  const existingBucket = buckets?.find(b => b.name === 'receipts')

  if (existingBucket) {
    console.log('📦 Bucket "receipts" already exists')
    
    if (existingBucket.public) {
      console.log('⚠️  Bucket is public. Deleting and recreating as private...')
      
      // Empty the bucket first
      const { data: files } = await supabase.storage.from('receipts').list()
      if (files && files.length > 0) {
        console.log(`   Removing ${files.length} existing files...`)
        const filePaths = files.map(f => f.name)
        await supabase.storage.from('receipts').remove(filePaths)
      }
      
      // Delete the bucket
      const { error: deleteError } = await supabase.storage.deleteBucket('receipts')
      if (deleteError) {
        console.error('❌ Failed to delete bucket:', deleteError.message)
        process.exit(1)
      }
      console.log('   ✓ Deleted public bucket')
    } else {
      console.log('✅ Bucket is already private!')
      return
    }
  }

  // 2. Create private bucket
  console.log('📦 Creating private bucket "receipts"...')
  const { error: createError } = await supabase.storage.createBucket('receipts', {
    public: false,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
  })

  if (createError) {
    console.error('❌ Failed to create bucket:', createError.message)
    process.exit(1)
  }

  console.log('✅ Private bucket "receipts" created successfully!')
  console.log('\n📋 Now add these RLS policies in Supabase Dashboard:')
  console.log('   Go to Storage → receipts → Policies → New Policy\n')
  console.log('   1. INSERT policy:')
  console.log('      Name: Users can upload receipts')
  console.log('      Definition: (auth.uid()::text = (storage.foldername(name))[1])\n')
  console.log('   2. SELECT policy:')
  console.log('      Name: Users can view own receipts')
  console.log('      Definition: (auth.uid()::text = (storage.foldername(name))[1])\n')
  console.log('   3. DELETE policy:')
  console.log('      Name: Users can delete own receipts')
  console.log('      Definition: (auth.uid()::text = (storage.foldername(name))[1])\n')
}

setupStorage()

