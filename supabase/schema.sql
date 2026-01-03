-- Cyncro Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension (should already be enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PURCHASES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  merchant TEXT,
  purchase_date DATE NOT NULL,
  price DECIMAL(10,2),
  warranty_months INTEGER DEFAULT 0,
  warranty_expires_at DATE GENERATED ALWAYS AS (
    purchase_date + (warranty_months * INTERVAL '1 month')
  ) STORED,
  category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: Add price, category, notes columns if they don't exist
-- Run this if you already have the purchases table
-- ALTER TABLE purchases ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
-- ALTER TABLE purchases ADD COLUMN IF NOT EXISTS category TEXT;
-- ALTER TABLE purchases ADD COLUMN IF NOT EXISTS notes TEXT;

-- Index for user queries
CREATE INDEX IF NOT EXISTS purchases_user_id_idx ON purchases(user_id);
CREATE INDEX IF NOT EXISTS purchases_item_name_idx ON purchases USING gin(to_tsvector('english', item_name));

-- RLS for purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchases"
  ON purchases FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchases"
  ON purchases FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- DOCUMENTS TABLE (receipts)
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image/jpeg', 'image/png', 'application/pdf'
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for purchase lookups
CREATE INDEX IF NOT EXISTS documents_purchase_id_idx ON documents(purchase_id);
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);

-- RLS for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PACKETS TABLE (claim packets)
-- ============================================
CREATE TABLE IF NOT EXISTS packets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for purchase lookups
CREATE INDEX IF NOT EXISTS packets_purchase_id_idx ON packets(purchase_id);
CREATE INDEX IF NOT EXISTS packets_user_id_idx ON packets(user_id);

-- RLS for packets
ALTER TABLE packets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own packets"
  ON packets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own packets"
  ON packets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own packets"
  ON packets FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE POLICIES
-- ============================================
-- Run these in the Supabase Dashboard > Storage > Policies
-- Or use the SQL below if you have the storage schema access

-- For the 'receipts' bucket (private bucket):
-- INSERT policy: Users can upload to their own folder
-- SELECT policy: Users can view their own files
-- DELETE policy: Users can delete their own files

-- Note: These policies should be created via the Supabase Dashboard
-- Go to Storage > receipts bucket > Policies and add:

-- 1. INSERT policy (name: "Users can upload receipts"):
--    (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1])

-- 2. SELECT policy (name: "Users can view own receipts"):
--    (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1])

-- 3. DELETE policy (name: "Users can delete own receipts"):
--    (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1])

