export interface Purchase {
  id: string
  user_id: string
  item_name: string
  merchant: string | null
  purchase_date: string
  warranty_months: number
  warranty_expires_at: string | null
  created_at: string
  updated_at: string
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
  warranty_months: number
}

