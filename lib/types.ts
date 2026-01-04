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
