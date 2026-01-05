import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { VaultLibrary, InsuranceRoom, VaultStats } from '@/lib/types'

const LIBRARIES: VaultLibrary[] = ['receipts', 'warranties', 'manuals', 'insurance', 'contracts']
const ROOMS: InsuranceRoom[] = ['kitchen', 'bedroom', 'living_room', 'bathroom', 'garage', 'office', 'outdoor', 'other']

// GET /api/vault/stats - Get vault statistics
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all vault items for the user
  const { data: items, error } = await supabase
    .from('vault_items')
    .select('library, room, estimated_value, expires_at')
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Initialize stats
  const by_library: Record<VaultLibrary, number> = {
    receipts: 0,
    warranties: 0,
    manuals: 0,
    insurance: 0,
    contracts: 0,
  }

  const by_room: Record<InsuranceRoom, { count: number; total_value: number }> = {} as Record<InsuranceRoom, { count: number; total_value: number }>
  for (const room of ROOMS) {
    by_room[room] = { count: 0, total_value: 0 }
  }

  let total_insurance_value = 0
  let expiring_soon = 0
  const today = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(today.getDate() + 30)

  // Process items
  for (const item of items || []) {
    // Count by library
    if (LIBRARIES.includes(item.library as VaultLibrary)) {
      by_library[item.library as VaultLibrary]++
    }

    // Count by room (for insurance items)
    if (item.room && ROOMS.includes(item.room as InsuranceRoom)) {
      by_room[item.room as InsuranceRoom].count++
      if (item.estimated_value) {
        by_room[item.room as InsuranceRoom].total_value += parseFloat(item.estimated_value as unknown as string)
      }
    }

    // Sum insurance value
    if (item.library === 'insurance' && item.estimated_value) {
      total_insurance_value += parseFloat(item.estimated_value as unknown as string)
    }

    // Check for expiring items
    if (item.expires_at) {
      const expiresDate = new Date(item.expires_at)
      if (expiresDate >= today && expiresDate <= thirtyDaysFromNow) {
        expiring_soon++
      }
    }
  }

  const stats: VaultStats = {
    total_items: items?.length || 0,
    by_library,
    by_room,
    total_insurance_value,
    expiring_soon,
  }

  return NextResponse.json(stats)
}
