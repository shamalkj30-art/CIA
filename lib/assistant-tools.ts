import Anthropic from '@anthropic-ai/sdk'
import { SupabaseClient } from '@supabase/supabase-js'
import type {
  Purchase,
  Subscription,
  Case,
  VaultItem,
  ToolCallRecord,
} from './types'

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const ASSISTANT_TOOLS: Anthropic.Tool[] = [
  // -------------------------------------------------------------------------
  // PURCHASES TOOLS
  // -------------------------------------------------------------------------
  {
    name: 'list_purchases',
    description: 'List user purchases with optional filters. Use to find purchases, calculate spending, or get overview.',
    input_schema: {
      type: 'object' as const,
      properties: {
        search: {
          type: 'string',
          description: 'Search by item name or merchant',
        },
        needs_review: {
          type: 'boolean',
          description: 'Filter to items needing review',
        },
        date_from: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        date_to: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
        category: {
          type: 'string',
          description: 'Filter by category',
        },
        limit: {
          type: 'number',
          description: 'Max results (default 20)',
        },
      },
    },
  },
  {
    name: 'get_purchase',
    description: 'Get details of a specific purchase by ID',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'string',
          description: 'Purchase ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_purchase',
    description: 'Create a new purchase record. Use when user wants to add a purchase.',
    input_schema: {
      type: 'object' as const,
      properties: {
        item_name: { type: 'string', description: 'Name of the item purchased' },
        merchant: { type: 'string', description: 'Store/merchant name' },
        purchase_date: { type: 'string', description: 'Date of purchase (YYYY-MM-DD)' },
        price: { type: 'number', description: 'Price paid' },
        warranty_months: { type: 'number', description: 'Warranty duration in months' },
        category: { type: 'string', description: 'Category (e.g., electronics, clothing)' },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: ['item_name', 'purchase_date'],
    },
  },
  {
    name: 'update_purchase',
    description: 'Update an existing purchase. Use to mark as verified, update details, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Purchase ID to update' },
        item_name: { type: 'string', description: 'New item name' },
        merchant: { type: 'string', description: 'New merchant name' },
        price: { type: 'number', description: 'New price' },
        needs_review: { type: 'boolean', description: 'Set review status' },
        notes: { type: 'string', description: 'New notes' },
        category: { type: 'string', description: 'New category' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_purchase',
    description: 'Delete a purchase. Only call this if the user explicitly confirms deletion.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Purchase ID to delete' },
      },
      required: ['id'],
    },
  },

  // -------------------------------------------------------------------------
  // SUBSCRIPTIONS TOOLS
  // -------------------------------------------------------------------------
  {
    name: 'list_subscriptions',
    description: 'List user subscriptions. Calculate monthly costs, find upcoming charges.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'paused', 'cancelled', 'expired'],
          description: 'Filter by status',
        },
        search: {
          type: 'string',
          description: 'Search by merchant or plan name',
        },
        upcoming_days: {
          type: 'number',
          description: 'Filter to subscriptions charging within N days',
        },
      },
    },
  },
  {
    name: 'create_subscription',
    description: 'Add a new subscription',
    input_schema: {
      type: 'object' as const,
      properties: {
        merchant: { type: 'string', description: 'Service name (e.g., Netflix, Spotify)' },
        plan_name: { type: 'string', description: 'Plan name (e.g., Premium, Family)' },
        price: { type: 'number', description: 'Price per billing period' },
        cadence: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
          description: 'Billing frequency',
        },
        next_charge_date: { type: 'string', description: 'Next charge date (YYYY-MM-DD)' },
        cancel_url: { type: 'string', description: 'URL to cancel the subscription' },
        category: { type: 'string', description: 'Category (e.g., streaming, software)' },
      },
      required: ['merchant', 'price', 'cadence'],
    },
  },
  {
    name: 'generate_cancel_kit',
    description: 'Generate AI-powered cancellation instructions for a subscription',
    input_schema: {
      type: 'object' as const,
      properties: {
        subscription_id: { type: 'string', description: 'Subscription ID' },
      },
      required: ['subscription_id'],
    },
  },
  {
    name: 'delete_subscription',
    description: 'Delete a subscription from tracking. Only call this if the user explicitly confirms deletion.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Subscription ID to delete' },
      },
      required: ['id'],
    },
  },

  // -------------------------------------------------------------------------
  // CASES TOOLS
  // -------------------------------------------------------------------------
  {
    name: 'list_cases',
    description: 'List user cases (returns, warranties, complaints)',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          enum: ['draft', 'sent', 'waiting', 'escalated', 'resolved'],
          description: 'Filter by status',
        },
        case_type: {
          type: 'string',
          enum: ['return', 'warranty', 'complaint', 'cancellation'],
          description: 'Filter by case type',
        },
      },
    },
  },
  {
    name: 'create_case',
    description: 'Create a new case for a return, warranty claim, or complaint',
    input_schema: {
      type: 'object' as const,
      properties: {
        case_type: {
          type: 'string',
          enum: ['return', 'warranty', 'complaint', 'cancellation'],
          description: 'Type of case',
        },
        subject: { type: 'string', description: 'Case subject/title' },
        description: { type: 'string', description: 'Detailed description of the issue' },
        merchant: { type: 'string', description: 'Merchant name' },
        purchase_id: { type: 'string', description: 'Link to existing purchase (optional)' },
        merchant_email: { type: 'string', description: 'Merchant contact email' },
      },
      required: ['case_type', 'subject', 'merchant'],
    },
  },
  {
    name: 'generate_case_message',
    description: 'Generate an AI message for a case (initial, follow-up, or escalation)',
    input_schema: {
      type: 'object' as const,
      properties: {
        case_id: { type: 'string', description: 'Case ID' },
        message_type: {
          type: 'string',
          enum: ['initial', 'follow_up', 'escalation'],
          description: 'Type of message to generate',
        },
        tone: {
          type: 'string',
          enum: ['friendly', 'professional', 'firm', 'concise'],
          description: 'Tone of the message',
        },
      },
      required: ['case_id'],
    },
  },

  // -------------------------------------------------------------------------
  // VAULT & ANALYTICS TOOLS
  // -------------------------------------------------------------------------
  {
    name: 'list_vault_items',
    description: 'List documents in the vault',
    input_schema: {
      type: 'object' as const,
      properties: {
        library: {
          type: 'string',
          enum: ['receipts', 'warranties', 'manuals', 'insurance', 'contracts'],
          description: 'Filter by library',
        },
        room: {
          type: 'string',
          enum: ['kitchen', 'bedroom', 'living_room', 'bathroom', 'garage', 'office', 'outdoor', 'other'],
          description: 'Filter by room (for insurance)',
        },
        expiring: {
          type: 'boolean',
          description: 'Filter to expiring items (next 30 days)',
        },
      },
    },
  },
  {
    name: 'get_spending_analytics',
    description: 'Get spending analytics and insights. Use for questions about spending, costs, trends.',
    input_schema: {
      type: 'object' as const,
      properties: {
        period: {
          type: 'string',
          enum: ['week', 'month', 'quarter', 'year', 'all'],
          description: 'Time period for analytics',
        },
        group_by: {
          type: 'string',
          enum: ['merchant', 'category', 'month'],
          description: 'How to group the results',
        },
      },
    },
  },
]

// =============================================================================
// TOOL EXECUTION
// =============================================================================

interface ToolExecutionContext {
  supabase: SupabaseClient
  userId: string
}

export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<ToolCallRecord> {
  const { supabase, userId } = context

  try {
    let output: unknown

    switch (toolName) {
      // Purchases
      case 'list_purchases':
        output = await listPurchases(supabase, userId, toolInput)
        break
      case 'get_purchase':
        output = await getPurchase(supabase, userId, toolInput.id as string)
        break
      case 'create_purchase':
        output = await createPurchase(supabase, userId, toolInput)
        break
      case 'update_purchase':
        output = await updatePurchase(supabase, userId, toolInput)
        break
      case 'delete_purchase':
        output = await deletePurchase(supabase, userId, toolInput.id as string)
        break

      // Subscriptions
      case 'list_subscriptions':
        output = await listSubscriptions(supabase, userId, toolInput)
        break
      case 'create_subscription':
        output = await createSubscription(supabase, userId, toolInput)
        break
      case 'generate_cancel_kit':
        output = await generateCancelKit(toolInput.subscription_id as string)
        break
      case 'delete_subscription':
        output = await deleteSubscription(supabase, userId, toolInput.id as string)
        break

      // Cases
      case 'list_cases':
        output = await listCases(supabase, userId, toolInput)
        break
      case 'create_case':
        output = await createCase(supabase, userId, toolInput)
        break
      case 'generate_case_message':
        output = await generateCaseMessage(toolInput.case_id as string, toolInput)
        break

      // Vault & Analytics
      case 'list_vault_items':
        output = await listVaultItems(supabase, userId, toolInput)
        break
      case 'get_spending_analytics':
        output = await getSpendingAnalytics(supabase, userId, toolInput)
        break

      default:
        output = { error: `Unknown tool: ${toolName}` }
    }

    return {
      tool_name: toolName,
      input: toolInput,
      output,
      success: true,
    }
  } catch (error) {
    return {
      tool_name: toolName,
      input: toolInput,
      output: { error: error instanceof Error ? error.message : 'Unknown error' },
      success: false,
    }
  }
}

// =============================================================================
// PURCHASES IMPLEMENTATIONS
// =============================================================================

async function listPurchases(
  supabase: SupabaseClient,
  userId: string,
  input: Record<string, unknown>
): Promise<{ purchases: Purchase[]; total: number }> {
  let query = supabase
    .from('purchases')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('purchase_date', { ascending: false })

  if (input.search) {
    query = query.or(`item_name.ilike.%${input.search}%,merchant.ilike.%${input.search}%`)
  }
  if (input.needs_review !== undefined) {
    query = query.eq('needs_review', input.needs_review)
  }
  if (input.date_from) {
    query = query.gte('purchase_date', input.date_from)
  }
  if (input.date_to) {
    query = query.lte('purchase_date', input.date_to)
  }
  if (input.category) {
    query = query.eq('category', input.category)
  }

  const limit = (input.limit as number) || 20
  query = query.limit(limit)

  const { data, count, error } = await query

  if (error) throw error

  return {
    purchases: data || [],
    total: count || 0,
  }
}

async function getPurchase(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<Purchase | null> {
  const { data, error } = await supabase
    .from('purchases')
    .select('*, documents(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

async function createPurchase(
  supabase: SupabaseClient,
  userId: string,
  input: Record<string, unknown>
): Promise<Purchase> {
  const purchaseData = {
    user_id: userId,
    item_name: input.item_name,
    merchant: input.merchant || null,
    purchase_date: input.purchase_date,
    price: input.price || null,
    warranty_months: input.warranty_months || 0,
    category: input.category || null,
    notes: input.notes || null,
    source: 'manual' as const,
    auto_detected: false,
    needs_review: false,
  }

  // Calculate warranty expiry if warranty_months provided
  if (purchaseData.warranty_months && purchaseData.purchase_date) {
    const purchaseDate = new Date(purchaseData.purchase_date as string)
    purchaseDate.setMonth(purchaseDate.getMonth() + (purchaseData.warranty_months as number))
    ;(purchaseData as Record<string, unknown>).warranty_expires_at = purchaseDate.toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('purchases')
    .insert(purchaseData)
    .select()
    .single()

  if (error) throw error
  return data
}

async function updatePurchase(
  supabase: SupabaseClient,
  userId: string,
  input: Record<string, unknown>
): Promise<Purchase> {
  const { id, ...updates } = input

  const { data, error } = await supabase
    .from('purchases')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

async function deletePurchase(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase
    .from('purchases')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
  return { success: true, message: 'Purchase deleted successfully' }
}

// =============================================================================
// SUBSCRIPTIONS IMPLEMENTATIONS
// =============================================================================

async function listSubscriptions(
  supabase: SupabaseClient,
  userId: string,
  input: Record<string, unknown>
): Promise<{ subscriptions: Subscription[]; total_monthly_cost: number }> {
  let query = supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('next_charge_date', { ascending: true })

  if (input.status) {
    query = query.eq('status', input.status)
  }
  if (input.search) {
    query = query.or(`merchant.ilike.%${input.search}%,plan_name.ilike.%${input.search}%`)
  }
  if (input.upcoming_days) {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + (input.upcoming_days as number))
    query = query.lte('next_charge_date', futureDate.toISOString().split('T')[0])
  }

  const { data, error } = await query

  if (error) throw error

  // Calculate monthly cost
  let totalMonthlyCost = 0
  for (const sub of data || []) {
    if (sub.status === 'active') {
      switch (sub.cadence) {
        case 'daily':
          totalMonthlyCost += sub.price * 30
          break
        case 'weekly':
          totalMonthlyCost += sub.price * 4.33
          break
        case 'monthly':
          totalMonthlyCost += sub.price
          break
        case 'quarterly':
          totalMonthlyCost += sub.price / 3
          break
        case 'yearly':
          totalMonthlyCost += sub.price / 12
          break
      }
    }
  }

  return {
    subscriptions: data || [],
    total_monthly_cost: Math.round(totalMonthlyCost * 100) / 100,
  }
}

async function createSubscription(
  supabase: SupabaseClient,
  userId: string,
  input: Record<string, unknown>
): Promise<Subscription> {
  const subscriptionData = {
    user_id: userId,
    merchant: input.merchant,
    plan_name: input.plan_name || null,
    price: input.price,
    currency: 'NOK',
    cadence: input.cadence,
    next_charge_date: input.next_charge_date || null,
    cancel_url: input.cancel_url || null,
    category: input.category || null,
    status: 'active' as const,
    renewal_confidence: 'estimated' as const,
    source: 'manual' as const,
    auto_detected: false,
    needs_review: false,
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .insert(subscriptionData)
    .select()
    .single()

  if (error) throw error
  return data
}

async function generateCancelKit(subscriptionId: string): Promise<{ redirect_url: string }> {
  // Return URL to the cancel kit API - it has its own AI generation
  return {
    redirect_url: `/api/subscriptions/${subscriptionId}/cancel-kit`,
  }
}

async function deleteSubscription(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
  return { success: true, message: 'Subscription deleted successfully' }
}

// =============================================================================
// CASES IMPLEMENTATIONS
// =============================================================================

async function listCases(
  supabase: SupabaseClient,
  userId: string,
  input: Record<string, unknown>
): Promise<{ cases: Case[]; total: number }> {
  let query = supabase
    .from('cases')
    .select('*, purchase:purchases(item_name, merchant)', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (input.status) {
    query = query.eq('status', input.status)
  }
  if (input.case_type) {
    query = query.eq('case_type', input.case_type)
  }

  const { data, count, error } = await query

  if (error) throw error

  return {
    cases: data || [],
    total: count || 0,
  }
}

async function createCase(
  supabase: SupabaseClient,
  userId: string,
  input: Record<string, unknown>
): Promise<Case> {
  const caseData = {
    user_id: userId,
    case_type: input.case_type,
    subject: input.subject,
    description: input.description || null,
    merchant: input.merchant,
    merchant_email: input.merchant_email || null,
    purchase_id: input.purchase_id || null,
    status: 'draft' as const,
    auto_follow_up: true,
  }

  const { data, error } = await supabase
    .from('cases')
    .insert(caseData)
    .select()
    .single()

  if (error) throw error

  // Create initial 'created' event
  await supabase.from('case_events').insert({
    case_id: data.id,
    user_id: userId,
    event_type: 'created',
    content: `Case created: ${input.subject}`,
  })

  return data
}

async function generateCaseMessage(
  caseId: string,
  input: Record<string, unknown>
): Promise<{ redirect_url: string; params: Record<string, unknown> }> {
  // Return URL to the case message API - it has its own AI generation
  return {
    redirect_url: `/api/cases/${caseId}/generate-message`,
    params: {
      message_type: input.message_type || 'initial',
      tone: input.tone || 'professional',
    },
  }
}

// =============================================================================
// VAULT IMPLEMENTATIONS
// =============================================================================

async function listVaultItems(
  supabase: SupabaseClient,
  userId: string,
  input: Record<string, unknown>
): Promise<{ items: VaultItem[]; total: number }> {
  let query = supabase
    .from('vault_items')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (input.library) {
    query = query.eq('library', input.library)
  }
  if (input.room) {
    query = query.eq('room', input.room)
  }
  if (input.expiring) {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    query = query
      .not('expires_at', 'is', null)
      .lte('expires_at', thirtyDaysFromNow.toISOString().split('T')[0])
  }

  const { data, count, error } = await query

  if (error) throw error

  return {
    items: data || [],
    total: count || 0,
  }
}

// =============================================================================
// ANALYTICS IMPLEMENTATIONS
// =============================================================================

interface SpendingAnalytics {
  total_spent: number
  purchase_count: number
  subscription_monthly_cost: number
  breakdown: { label: string; amount: number; count: number }[]
  period: string
}

async function getSpendingAnalytics(
  supabase: SupabaseClient,
  userId: string,
  input: Record<string, unknown>
): Promise<SpendingAnalytics> {
  const period = (input.period as string) || 'month'
  const groupBy = (input.group_by as string) || 'category'

  // Calculate date range
  let dateFrom: string | null = null
  const now = new Date()

  switch (period) {
    case 'week':
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      break
    case 'month':
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      break
    case 'quarter':
      dateFrom = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split('T')[0]
      break
    case 'year':
      dateFrom = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
      break
    case 'all':
      dateFrom = null
      break
  }

  // Get purchases
  let purchaseQuery = supabase
    .from('purchases')
    .select('price, category, merchant, purchase_date')
    .eq('user_id', userId)
    .not('price', 'is', null)

  if (dateFrom) {
    purchaseQuery = purchaseQuery.gte('purchase_date', dateFrom)
  }

  const { data: purchases, error: purchaseError } = await purchaseQuery

  if (purchaseError) throw purchaseError

  // Get active subscriptions monthly cost
  const { data: subscriptions, error: subError } = await supabase
    .from('subscriptions')
    .select('price, cadence')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (subError) throw subError

  // Calculate totals
  const totalSpent = purchases?.reduce((sum, p) => sum + (p.price || 0), 0) || 0
  const purchaseCount = purchases?.length || 0

  let subscriptionMonthlyCost = 0
  for (const sub of subscriptions || []) {
    switch (sub.cadence) {
      case 'monthly':
        subscriptionMonthlyCost += sub.price
        break
      case 'yearly':
        subscriptionMonthlyCost += sub.price / 12
        break
      case 'quarterly':
        subscriptionMonthlyCost += sub.price / 3
        break
      case 'weekly':
        subscriptionMonthlyCost += sub.price * 4.33
        break
    }
  }

  // Group breakdown
  const breakdown: { label: string; amount: number; count: number }[] = []
  const groups = new Map<string, { amount: number; count: number }>()

  for (const purchase of purchases || []) {
    let key: string
    switch (groupBy) {
      case 'merchant':
        key = purchase.merchant || 'Unknown'
        break
      case 'month':
        key = purchase.purchase_date?.substring(0, 7) || 'Unknown'
        break
      case 'category':
      default:
        key = purchase.category || 'Uncategorized'
        break
    }

    const existing = groups.get(key) || { amount: 0, count: 0 }
    groups.set(key, {
      amount: existing.amount + (purchase.price || 0),
      count: existing.count + 1,
    })
  }

  for (const [label, data] of groups) {
    breakdown.push({ label, amount: Math.round(data.amount * 100) / 100, count: data.count })
  }

  // Sort by amount descending
  breakdown.sort((a, b) => b.amount - a.amount)

  return {
    total_spent: Math.round(totalSpent * 100) / 100,
    purchase_count: purchaseCount,
    subscription_monthly_cost: Math.round(subscriptionMonthlyCost * 100) / 100,
    breakdown: breakdown.slice(0, 10), // Top 10
    period,
  }
}
