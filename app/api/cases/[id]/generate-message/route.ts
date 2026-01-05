import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Case, CaseMessageType, MessageTone, ActionPack } from '@/lib/types'

type RouteContext = { params: Promise<{ id: string }> }

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// POST /api/cases/[id]/generate-message - Generate an AI message for a case
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the case with related data
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select(`
        *,
        purchase:purchases(id, item_name, merchant, price, purchase_date, order_number, warranty_expires_at, return_deadline),
        subscription:subscriptions(id, merchant, plan_name, price, cadence)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const body = await request.json()
    const messageType: CaseMessageType = body.message_type || 'initial'
    const tone: MessageTone = body.tone || 'professional'

    // Generate the action pack with AI
    const actionPack = await generateActionPack(caseData as Case & { purchase?: unknown; subscription?: unknown }, messageType, tone)

    // Store the generated message
    const { data: savedMessage, error: saveError } = await supabase
      .from('case_messages')
      .insert({
        case_id: id,
        user_id: user.id,
        message_type: messageType,
        subject: actionPack.draft_message.subject,
        body: actionPack.draft_message.body,
        ai_generated: true,
        ai_prompt: `Generate ${messageType} message for ${caseData.case_type} case`,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving message:', saveError)
      // Continue anyway - still return the generated pack
    }

    return NextResponse.json({
      ...actionPack,
      message_id: savedMessage?.id,
    })
  } catch (error) {
    console.error('Generate message API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Tone instructions for AI
const toneInstructions: Record<MessageTone, string> = {
  friendly: `Write in a warm, understanding tone. Express appreciation for their time and help. Use phrases like "I would appreciate if...", "Thank you for your help with...", and "I understand that...". Be polite and non-confrontational while still being clear about what you need.`,
  professional: `Write in a balanced, business-like tone. Be clear about expectations while remaining courteous. Use formal but not stiff language.`,
  firm: `Write in an assertive tone. Clearly reference consumer rights (angrerett, reklamasjon, forbrukerkjøpsloven). Set firm deadlines. Use phrases like "I expect...", "In accordance with...", and "I require...". Be direct about consequences if the issue is not resolved.`,
  concise: `Be brief and direct. State the issue, what you want, and any deadline in as few words as possible. Minimal pleasantries - just the essential facts. Use bullet points where appropriate.`,
}

async function generateActionPack(
  caseData: Case & { purchase?: unknown; subscription?: unknown },
  messageType: CaseMessageType,
  tone: MessageTone = 'professional'
): Promise<ActionPack> {
  // Build context for AI
  const purchaseInfo = caseData.purchase as Record<string, unknown> | null
  const subscriptionInfo = caseData.subscription as Record<string, unknown> | null

  let itemContext = ''
  if (purchaseInfo) {
    itemContext = `
Product: ${purchaseInfo.item_name}
Merchant: ${purchaseInfo.merchant}
Price: ${purchaseInfo.price ? `kr ${purchaseInfo.price}` : 'Unknown'}
Purchase Date: ${purchaseInfo.purchase_date || 'Unknown'}
Order Number: ${purchaseInfo.order_number || 'Not available'}
${purchaseInfo.warranty_expires_at ? `Warranty Expires: ${purchaseInfo.warranty_expires_at}` : ''}
${purchaseInfo.return_deadline ? `Return Deadline: ${purchaseInfo.return_deadline}` : ''}`
  } else if (subscriptionInfo) {
    itemContext = `
Service: ${subscriptionInfo.merchant}${subscriptionInfo.plan_name ? ` (${subscriptionInfo.plan_name})` : ''}
Price: kr ${subscriptionInfo.price} per ${subscriptionInfo.cadence}`
  }

  const caseTypeLabels: Record<string, string> = {
    return: 'Product Return Request',
    warranty: 'Warranty Claim',
    complaint: 'Customer Complaint',
    cancellation: 'Subscription Cancellation',
  }

  const messageTypeLabels: Record<string, string> = {
    initial: 'initial contact',
    follow_up: 'follow-up (no response received)',
    escalation: 'escalation to supervisor/manager',
    custom: 'custom message',
  }

  const toneInstruction = toneInstructions[tone]

  const prompt = `You are helping a Norwegian consumer write a ${messageTypeLabels[messageType]} email for a ${caseTypeLabels[caseData.case_type] || caseData.case_type}.

TONE INSTRUCTION:
${toneInstruction}

Case Details:
- Type: ${caseData.case_type}
- Subject: ${caseData.subject}
- Description: ${caseData.description || 'Not provided'}
- Merchant: ${caseData.merchant}
${itemContext}

Norwegian Consumer Rights Context:
- "Angrerett" (Right of Withdrawal): 14 days for online purchases
- "Reklamasjon" (Complaint Right): 2 years for defects, 5 years for items expected to last longer
- Consumers have strong protections under Norwegian Consumer Purchase Act (Forbrukerkjøpsloven)

Generate a response in the following JSON format:
{
  "steps": [
    {
      "step_number": 1,
      "title": "Short action title",
      "description": "Detailed description of what to do",
      "action_type": "email|call|navigate|upload|wait",
      "action_url": "optional URL if applicable",
      "deadline": "optional deadline like 'within 14 days'"
    }
  ],
  "draft_message": {
    "subject": "Email subject line in Norwegian",
    "body": "Full email body in Norwegian following the tone instruction above"
  },
  "escalation_message": {
    "subject": "Escalation email subject in Norwegian",
    "body": "Escalation email body in Norwegian, referencing consumer rights"
  },
  "legal_info": "Brief explanation of relevant Norwegian consumer rights"
}

${messageType === 'follow_up' ? 'The follow-up should reference that no response was received and set a clear deadline.' : ''}
${messageType === 'escalation' ? 'The escalation should firmly reference consumer rights and request supervisor involvement.' : ''}

Write the email in Norwegian but keep the JSON keys in English. Follow the tone instruction carefully.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extract text content
    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI')
    }

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }

    const result = JSON.parse(jsonMatch[0])

    return {
      case_type: caseData.case_type,
      merchant: caseData.merchant,
      steps: result.steps || [],
      draft_message: result.draft_message || { subject: '', body: '' },
      escalation_message: result.escalation_message,
      legal_info: result.legal_info,
    }
  } catch (aiError) {
    console.error('AI generation error:', aiError)

    // Return a fallback template
    return generateFallbackPack(caseData, messageType)
  }
}

function generateFallbackPack(
  caseData: Case,
  messageType: CaseMessageType
): ActionPack {
  const templates: Record<string, { subject: string; body: string }> = {
    return: {
      subject: `Angrerett - Retur av ordre`,
      body: `Hei,

Jeg ønsker å benytte min angrerett i henhold til angrerettloven og returnere følgende:

${caseData.subject}

Vennligst bekreft mottakelsen av denne henvendelsen og send meg informasjon om returprosessen.

Med vennlig hilsen`,
    },
    warranty: {
      subject: `Reklamasjon - ${caseData.subject}`,
      body: `Hei,

Jeg ønsker å reklamere på følgende produkt:

${caseData.subject}

${caseData.description || 'Produktet fungerer ikke som forventet.'}

I henhold til forbrukerkjøpsloven har jeg rett til å få produktet reparert, byttet eller refundert.

Vennligst ta kontakt for å avtale videre håndtering.

Med vennlig hilsen`,
    },
    complaint: {
      subject: `Klage - ${caseData.subject}`,
      body: `Hei,

Jeg ønsker å klage på følgende:

${caseData.subject}

${caseData.description || ''}

Jeg forventer en rask løsning på denne saken.

Med vennlig hilsen`,
    },
    cancellation: {
      subject: `Oppsigelse av abonnement`,
      body: `Hei,

Jeg ønsker herved å si opp mitt abonnement:

${caseData.subject}

Vennligst bekreft oppsigelsen og informer meg om eventuell bindingstid eller oppsigelsestid.

Med vennlig hilsen`,
    },
  }

  const template = templates[caseData.case_type] || templates.complaint

  if (messageType === 'follow_up') {
    template.subject = `Purring: ${template.subject}`
    template.body = `Hei,

Jeg viser til min henvendelse angående:

${caseData.subject}

Jeg har dessverre ikke mottatt svar på denne henvendelsen. Jeg ber om at dere behandler saken innen 7 dager.

${template.body.split('\n\n').slice(2).join('\n\n')}`
  }

  return {
    case_type: caseData.case_type,
    merchant: caseData.merchant,
    steps: [
      {
        step_number: 1,
        title: 'Send e-post',
        description: `Send e-posten til ${caseData.merchant}`,
        action_type: 'email',
        action_url: caseData.merchant_email ? `mailto:${caseData.merchant_email}` : undefined,
      },
      {
        step_number: 2,
        title: 'Vent på svar',
        description: 'Vent på svar fra forhandler. Normal svartid er 1-5 virkedager.',
        action_type: 'wait',
        deadline: '7 dager',
      },
      {
        step_number: 3,
        title: 'Følg opp',
        description: 'Hvis du ikke har mottatt svar, send en purring.',
        action_type: 'email',
      },
    ],
    draft_message: template,
    legal_info:
      caseData.case_type === 'return'
        ? 'Du har 14 dagers angrerett ved kjøp på nett (angrerettloven).'
        : 'Du har 2-5 års reklamasjonsrett avhengig av produktets forventede levetid (forbrukerkjøpsloven).',
  }
}
