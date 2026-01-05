import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// This endpoint should be called by a cron job daily
// POST /api/cron/case-followups
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const results = {
      follow_ups_sent: 0,
      escalations_sent: 0,
      errors: [] as string[],
    }

    // Get all cases that need follow-up today
    const { data: followUpCases, error: followUpError } = await supabase
      .from('cases')
      .select('*')
      .lte('follow_up_at', today.toISOString())
      .eq('auto_follow_up', true)
      .not('status', 'in', '("resolved","closed")')

    if (followUpError) {
      console.error('Error fetching follow-up cases:', followUpError)
      return NextResponse.json({ error: followUpError.message }, { status: 500 })
    }

    for (const caseData of followUpCases || []) {
      try {
        // Check user's notification settings
        const { data: settings } = await supabase
          .from('notification_settings')
          .select('case_follow_up')
          .eq('user_id', caseData.user_id)
          .single()

        const isFollowUpEnabled = settings?.case_follow_up ?? true

        if (!isFollowUpEnabled) {
          continue
        }

        // Create follow-up notification
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: caseData.user_id,
          type: 'case_follow_up',
          title: `Follow up on: ${caseData.subject}`,
          message: `Your case with ${caseData.merchant} needs a follow-up. No response received yet.`,
          action_url: `/cases/${caseData.id}`,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })

        if (notifError) {
          console.error('Error creating follow-up notification:', notifError)
          results.errors.push(`Case ${caseData.id}: ${notifError.message}`)
          continue
        }

        // Add event to case timeline
        await supabase.from('case_events').insert({
          case_id: caseData.id,
          user_id: caseData.user_id,
          event_type: 'follow_up_sent',
          content: 'Automated follow-up reminder sent',
        })

        // Update follow-up date to 3 days from now (for next reminder)
        const nextFollowUp = new Date()
        nextFollowUp.setDate(nextFollowUp.getDate() + 3)

        await supabase
          .from('cases')
          .update({ follow_up_at: nextFollowUp.toISOString() })
          .eq('id', caseData.id)

        results.follow_ups_sent++
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Error processing follow-up for case ${caseData.id}:`, error)
        results.errors.push(`Case ${caseData.id}: ${errorMessage}`)
      }
    }

    // Get all cases that need escalation today
    const { data: escalationCases, error: escalationError } = await supabase
      .from('cases')
      .select('*')
      .lte('escalation_at', today.toISOString())
      .not('status', 'in', '("resolved","closed","escalated")')

    if (escalationError) {
      console.error('Error fetching escalation cases:', escalationError)
      // Continue with results from follow-ups
    } else {
      for (const caseData of escalationCases || []) {
        try {
          // Check user's notification settings
          const { data: settings } = await supabase
            .from('notification_settings')
            .select('case_escalation')
            .eq('user_id', caseData.user_id)
            .single()

          const isEscalationEnabled = settings?.case_escalation ?? true

          if (!isEscalationEnabled) {
            continue
          }

          // Create escalation notification
          const { error: notifError } = await supabase.from('notifications').insert({
            user_id: caseData.user_id,
            type: 'case_escalation',
            title: `Time to escalate: ${caseData.subject}`,
            message: `Your case with ${caseData.merchant} has been waiting for 7 days. Consider escalating.`,
            action_url: `/cases/${caseData.id}`,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })

          if (notifError) {
            console.error('Error creating escalation notification:', notifError)
            results.errors.push(`Case ${caseData.id} (escalation): ${notifError.message}`)
            continue
          }

          // Add escalation event to case timeline
          await supabase.from('case_events').insert({
            case_id: caseData.id,
            user_id: caseData.user_id,
            event_type: 'escalation',
            content: 'Automated escalation reminder - 7 days without response',
          })

          // Update case status to show it's ready for escalation
          // Don't auto-escalate, just notify
          await supabase
            .from('cases')
            .update({ escalation_at: null }) // Clear escalation date so we don't keep notifying
            .eq('id', caseData.id)

          results.escalations_sent++
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          console.error(`Error processing escalation for case ${caseData.id}:`, error)
          results.errors.push(`Case ${caseData.id} (escalation): ${errorMessage}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      date: today.toISOString().split('T')[0],
      ...results,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Case follow-ups cron error:', error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'case-followups',
    description: 'Daily cron job to send case follow-up and escalation notifications',
  })
}
