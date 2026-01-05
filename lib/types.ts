export interface Purchase {
  id: string
  user_id: string
  item_name: string
  merchant: string | null
  purchase_date: string
  price: number | null
  warranty_months: number
  warranty_expires_at: string | null
  category: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // New fields for email automation
  source: 'manual' | 'email_forwarded' | 'gmail_auto'
  order_number: string | null
  return_deadline: string | null
  email_metadata: EmailMetadata | null
  auto_detected: boolean
  needs_review: boolean
}

export interface EmailMetadata {
  subject: string
  sender: string
  received_at: string
  gmail_message_id?: string
  confidence: 'high' | 'medium' | 'low'
}

export interface Document {
  id: string
  purchase_id: string
  user_id: string
  storage_path: string
  file_name: string
  file_type: string
  file_size: number | null
  created_at: string
}

export interface Packet {
  id: string
  purchase_id: string
  user_id: string
  storage_path: string
  file_name: string
  generated_at: string
}

export interface PurchaseWithDocuments extends Purchase {
  documents: Document[]
}

export interface CreatePurchaseInput {
  item_name: string
  merchant?: string
  purchase_date: string
  price?: number
  warranty_months: number
  category?: string
  notes?: string
  // New optional fields
  source?: 'manual' | 'email_forwarded' | 'gmail_auto'
  order_number?: string
  return_deadline?: string
  email_metadata?: EmailMetadata
  auto_detected?: boolean
  needs_review?: boolean
}

// Email connection types
export interface EmailConnection {
  id: string
  user_id: string
  provider: 'gmail' | 'outlook'
  email_address: string
  last_sync_at: string | null
  sync_enabled: boolean
  created_at: string
  updated_at: string
}

// Notification types
export type NotificationType =
  | 'warranty_expiring'
  | 'return_deadline'
  | 'new_purchase'
  | 'gmail_connected'
  | 'gmail_sync_error'
  | 'subscription_charge'
  | 'case_follow_up'
  | 'case_escalation'
  | 'case_resolved'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  purchase_id: string | null
  read: boolean
  action_url: string | null
  expires_at: string | null
  created_at: string
}

export interface NotificationSettings {
  id: string
  user_id: string
  warranty_expiring: boolean
  warranty_expiring_days: number
  return_deadline: boolean
  return_deadline_days: number
  new_purchase: boolean
  email_notifications: boolean
}

// AI extraction types
export interface ExtractedItem {
  name: string
  price: number | null
  quantity: number
  category: string | null
}

export interface OrderExtractionResult {
  is_order_confirmation: boolean
  confidence: 'high' | 'medium' | 'low'
  order_number: string | null
  items: ExtractedItem[]
  merchant: string | null
  order_date: string | null // YYYY-MM-DD
  total_amount: number | null
  currency: string | null
  return_deadline: string | null // YYYY-MM-DD
  warranty_months: number | null
  tracking_number: string | null
  estimated_delivery: string | null
}

// =============================================================================
// SUBSCRIPTIONS TYPES
// =============================================================================

export type SubscriptionCadence = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired'
export type RenewalConfidence = 'confirmed' | 'estimated' | 'needs_confirmation'

export interface Subscription {
  id: string
  user_id: string

  // Merchant info
  merchant: string
  plan_name: string | null
  logo_url: string | null

  // Billing details
  price: number
  currency: string
  cadence: SubscriptionCadence

  // Charge dates
  next_charge_date: string | null // YYYY-MM-DD
  last_charge_date: string | null // YYYY-MM-DD

  // Trust/confidence level
  renewal_confidence: RenewalConfidence

  // Status
  status: SubscriptionStatus

  // Contact/cancel info
  cancel_url: string | null
  support_email: string | null
  support_phone: string | null

  // Category
  category: string | null

  // Notes
  notes: string | null

  // Source tracking
  source: 'manual' | 'gmail_auto' | 'bank_import'
  email_metadata: EmailMetadata | null
  auto_detected: boolean
  needs_review: boolean

  // Timestamps
  created_at: string
  updated_at: string
}

export interface SubscriptionAlert {
  id: string
  subscription_id: string
  user_id: string
  alert_type: '7_day' | '3_day' | '1_day' | 'day_of'
  alert_date: string // YYYY-MM-DD
  sent: boolean
  sent_at: string | null
  created_at: string
}

export interface SubscriptionHistory {
  id: string
  subscription_id: string
  event_type: 'created' | 'price_change' | 'renewed' | 'cancelled' | 'reactivated' | 'updated'
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  occurred_at: string
}

export interface CreateSubscriptionInput {
  merchant: string
  plan_name?: string
  logo_url?: string
  price: number
  currency?: string
  cadence: SubscriptionCadence
  next_charge_date?: string
  last_charge_date?: string
  renewal_confidence?: RenewalConfidence
  status?: SubscriptionStatus
  cancel_url?: string
  support_email?: string
  support_phone?: string
  category?: string
  notes?: string
  source?: 'manual' | 'gmail_auto' | 'bank_import'
}

export interface UpdateSubscriptionInput {
  merchant?: string
  plan_name?: string | null
  logo_url?: string | null
  price?: number
  currency?: string
  cadence?: SubscriptionCadence
  next_charge_date?: string | null
  last_charge_date?: string | null
  renewal_confidence?: RenewalConfidence
  status?: SubscriptionStatus
  cancel_url?: string | null
  support_email?: string | null
  support_phone?: string | null
  category?: string | null
  notes?: string | null
}

// Cancel Kit - AI-generated cancellation assistance
export interface CancelKit {
  subscription: Subscription
  steps: CancelStep[]
  draft_message: string
  merchant_contact: {
    email: string | null
    phone: string | null
    cancel_url: string | null
  }
}

export interface CancelStep {
  step_number: number
  title: string
  description: string
  action_type: 'navigate' | 'click' | 'call' | 'email' | 'wait'
  action_url?: string
}

// Subscription with computed fields for UI
export interface SubscriptionWithAlerts extends Subscription {
  upcoming_alerts: SubscriptionAlert[]
  days_until_charge: number | null
}

// =============================================================================
// CASES TYPES
// =============================================================================

export type CaseType = 'return' | 'warranty' | 'complaint' | 'cancellation'
export type CaseStatus = 'draft' | 'sent' | 'waiting' | 'escalated' | 'resolved' | 'closed'
export type ResolutionOutcome = 'refund_full' | 'refund_partial' | 'replacement' | 'repair' | 'rejected' | 'withdrawn' | 'other'

export interface Case {
  id: string
  user_id: string

  // Related entities (optional)
  purchase_id: string | null
  subscription_id: string | null

  // Case details
  case_type: CaseType
  status: CaseStatus
  subject: string
  description: string | null

  // Merchant info
  merchant: string
  merchant_email: string | null
  merchant_phone: string | null

  // Tracking
  reference_number: string | null

  // Follow-up automation
  follow_up_at: string | null
  escalation_at: string | null
  auto_follow_up: boolean

  // Resolution
  resolved_at: string | null
  resolution_notes: string | null
  resolution_outcome: ResolutionOutcome | null

  // Timestamps
  created_at: string
  updated_at: string
}

export type CaseEventType =
  | 'created'
  | 'message_sent'
  | 'message_received'
  | 'status_change'
  | 'escalation'
  | 'follow_up_sent'
  | 'note'
  | 'attachment_added'
  | 'resolved'

export interface CaseEvent {
  id: string
  case_id: string
  user_id: string
  event_type: CaseEventType
  content: string | null
  old_status: CaseStatus | null
  new_status: CaseStatus | null
  attachment_path: string | null
  attachment_name: string | null
  created_at: string
}

export type CaseMessageType = 'initial' | 'follow_up' | 'escalation' | 'custom'
export type MessageTone = 'friendly' | 'professional' | 'firm' | 'concise'

export interface CaseMessage {
  id: string
  case_id: string
  user_id: string
  message_type: CaseMessageType
  subject: string | null
  body: string
  ai_generated: boolean
  ai_prompt: string | null
  copied_at: string | null
  sent_at: string | null
  created_at: string
}

export interface CreateCaseInput {
  purchase_id?: string
  subscription_id?: string
  case_type: CaseType
  subject: string
  description?: string
  merchant: string
  merchant_email?: string
  merchant_phone?: string
  auto_follow_up?: boolean
}

export interface UpdateCaseInput {
  case_type?: CaseType
  status?: CaseStatus
  subject?: string
  description?: string | null
  merchant?: string
  merchant_email?: string | null
  merchant_phone?: string | null
  reference_number?: string | null
  follow_up_at?: string | null
  escalation_at?: string | null
  auto_follow_up?: boolean
  resolution_notes?: string | null
  resolution_outcome?: ResolutionOutcome | null
}

// Case with related entities for UI
export interface CaseWithRelations extends Case {
  purchase?: Purchase | null
  subscription?: Subscription | null
  events?: CaseEvent[]
  messages?: CaseMessage[]
}

// AI-generated action pack for cases
export interface ActionPack {
  case_type: CaseType
  merchant: string
  steps: ActionStep[]
  draft_message: {
    subject: string
    body: string
  }
  escalation_message?: {
    subject: string
    body: string
  }
  legal_info?: string // Consumer rights info (e.g., Norwegian "Angrerett")
}

export interface ActionStep {
  step_number: number
  title: string
  description: string
  action_type: 'email' | 'call' | 'navigate' | 'upload' | 'wait'
  action_url?: string
  deadline?: string // e.g., "within 14 days"
}

// =============================================================================
// EVIDENCE MODE TYPES
// =============================================================================

export type ProofScore = 'ready' | 'almost_ready' | 'not_ready'
export type TrustLevel = 'high' | 'medium' | 'low' | 'manual'

// =============================================================================
// VAULT TYPES
// =============================================================================

export type VaultLibrary = 'receipts' | 'warranties' | 'manuals' | 'insurance' | 'contracts'
export type InsuranceRoom = 'kitchen' | 'bedroom' | 'living_room' | 'bathroom' | 'garage' | 'office' | 'outdoor' | 'other'

export interface VaultItem {
  id: string
  user_id: string

  // Library categorization
  library: VaultLibrary

  // File info
  title: string
  storage_path: string
  file_name: string
  file_type: string
  file_size: number | null

  // Organization
  room: InsuranceRoom | null
  tags: string[]

  // Optional linking
  purchase_id: string | null

  // Value tracking (for insurance)
  estimated_value: number | null
  currency: string

  // Expiry tracking
  expires_at: string | null

  // Notes
  notes: string | null

  // Timestamps
  created_at: string
  updated_at: string
}

export interface InsurancePack {
  id: string
  user_id: string

  // Pack details
  pack_name: string

  // Scope
  room: InsuranceRoom | null
  rooms_included: string[]

  // Generated files
  pdf_path: string | null
  zip_path: string | null

  // Stats
  document_count: number
  total_value: number | null

  // Status
  status: 'generating' | 'generated' | 'failed'

  // Timestamps
  generated_at: string
}

export interface CreateVaultItemInput {
  library: VaultLibrary
  title: string
  room?: InsuranceRoom
  tags?: string[]
  purchase_id?: string
  estimated_value?: number
  currency?: string
  expires_at?: string
  notes?: string
}

export interface UpdateVaultItemInput {
  library?: VaultLibrary
  title?: string
  room?: InsuranceRoom | null
  tags?: string[]
  purchase_id?: string | null
  estimated_value?: number | null
  currency?: string
  expires_at?: string | null
  notes?: string | null
}

// Room configuration for UI
export interface RoomConfig {
  id: InsuranceRoom
  label: string
  icon: string
}

export const ROOM_CONFIGS: RoomConfig[] = [
  { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { id: 'bedroom', label: 'Bedroom', icon: '🛏' },
  { id: 'living_room', label: 'Living Room', icon: '🛋' },
  { id: 'bathroom', label: 'Bathroom', icon: '🚿' },
  { id: 'garage', label: 'Garage', icon: '🚗' },
  { id: 'office', label: 'Office', icon: '💼' },
  { id: 'outdoor', label: 'Outdoor', icon: '🌳' },
  { id: 'other', label: 'Other', icon: '📦' },
]

// Library configuration for UI
export interface LibraryConfig {
  id: VaultLibrary
  label: string
  icon: string
  description: string
}

export const LIBRARY_CONFIGS: LibraryConfig[] = [
  { id: 'receipts', label: 'Receipts', icon: '🧾', description: 'Purchase receipts and invoices' },
  { id: 'warranties', label: 'Warranties', icon: '🛡️', description: 'Warranty cards and certificates' },
  { id: 'manuals', label: 'Manuals', icon: '📖', description: 'Product manuals and guides' },
  { id: 'insurance', label: 'Insurance', icon: '🏠', description: 'Insurance documents and claims' },
  { id: 'contracts', label: 'Contracts', icon: '📝', description: 'Contracts and agreements' },
]

// Vault stats for dashboard
export interface VaultStats {
  total_items: number
  by_library: Record<VaultLibrary, number>
  by_room: Record<InsuranceRoom, { count: number; total_value: number }>
  total_insurance_value: number
  expiring_soon: number // items expiring in next 30 days
}
