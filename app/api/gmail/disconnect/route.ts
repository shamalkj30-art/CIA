import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete email connection
    const { error: deleteError } = await supabase
      .from('email_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'gmail')

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Disconnect error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect' },
      { status: 500 }
    )
  }
}

