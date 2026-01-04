/**
 * Clear failed email records to allow retry
 * Run with: npx tsx scripts/clear-failed-emails.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function clearFailedEmails() {
  console.log('🗑️  Clearing failed email records...')

  const { data, error } = await supabase
    .from('processed_emails')
    .delete()
    .eq('result', 'failed')
    .select()

  if (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }

  console.log(`✅ Deleted ${data?.length || 0} failed email records`)
  console.log('These emails can now be retried via Resend webhook replay')
}

clearFailedEmails()
