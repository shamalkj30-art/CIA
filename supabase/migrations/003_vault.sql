-- =============================================================================
-- VAULT SYSTEM MIGRATION
-- Phase 4 of Premium Upgrade
-- =============================================================================

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS insurance_packs CASCADE;
DROP TABLE IF EXISTS vault_items CASCADE;

-- =============================================================================
-- VAULT ITEMS TABLE
-- Stores documents organized into libraries
-- =============================================================================

CREATE TABLE vault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Library categorization
  library TEXT NOT NULL CHECK (library IN ('receipts', 'warranties', 'manuals', 'insurance', 'contracts')),

  -- File info
  title TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,

  -- Organization
  room TEXT CHECK (room IS NULL OR room IN ('kitchen', 'bedroom', 'living_room', 'bathroom', 'garage', 'office', 'outdoor', 'other')),
  tags TEXT[] DEFAULT '{}',

  -- Optional linking to existing purchase
  purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,

  -- Value tracking (for insurance purposes)
  estimated_value DECIMAL(12,2),
  currency TEXT DEFAULT 'NOK',

  -- Expiry tracking (for warranties, insurance policies, contracts)
  expires_at DATE,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INSURANCE PACKS TABLE
-- Generated claim packages (PDF + ZIP)
-- =============================================================================

CREATE TABLE insurance_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Pack details
  pack_name TEXT NOT NULL,

  -- Scope (NULL room means all rooms)
  room TEXT CHECK (room IS NULL OR room IN ('kitchen', 'bedroom', 'living_room', 'bathroom', 'garage', 'office', 'outdoor', 'other')),
  rooms_included TEXT[] DEFAULT '{}', -- Array of rooms included if multiple

  -- Generated files
  pdf_path TEXT,
  zip_path TEXT,

  -- Stats
  document_count INTEGER DEFAULT 0,
  total_value DECIMAL(12,2), -- Sum of item values

  -- Status
  status TEXT DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'failed')),

  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_packs ENABLE ROW LEVEL SECURITY;

-- Vault items policies
CREATE POLICY "Users can view own vault items" ON vault_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vault items" ON vault_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vault items" ON vault_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vault items" ON vault_items
  FOR DELETE USING (auth.uid() = user_id);

-- Insurance packs policies
CREATE POLICY "Users can view own insurance packs" ON insurance_packs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insurance packs" ON insurance_packs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insurance packs" ON insurance_packs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insurance packs" ON insurance_packs
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Vault items indexes
CREATE INDEX idx_vault_items_user_library ON vault_items(user_id, library);
CREATE INDEX idx_vault_items_user_room ON vault_items(user_id, room) WHERE room IS NOT NULL;
CREATE INDEX idx_vault_items_tags ON vault_items USING GIN(tags);
CREATE INDEX idx_vault_items_purchase ON vault_items(purchase_id) WHERE purchase_id IS NOT NULL;
CREATE INDEX idx_vault_items_expires ON vault_items(user_id, expires_at) WHERE expires_at IS NOT NULL;

-- Insurance packs indexes
CREATE INDEX idx_insurance_packs_user ON insurance_packs(user_id);
CREATE INDEX idx_insurance_packs_room ON insurance_packs(user_id, room) WHERE room IS NOT NULL;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamp trigger for vault_items
CREATE OR REPLACE FUNCTION update_vault_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vault_items_updated_at
  BEFORE UPDATE ON vault_items
  FOR EACH ROW
  EXECUTE FUNCTION update_vault_items_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE vault_items IS 'Document vault for organizing receipts, warranties, manuals, insurance docs, and contracts';
COMMENT ON TABLE insurance_packs IS 'Generated insurance claim packages with PDF summaries and ZIP archives';

COMMENT ON COLUMN vault_items.library IS 'Document library: receipts, warranties, manuals, insurance, contracts';
COMMENT ON COLUMN vault_items.room IS 'Room for insurance docs: kitchen, bedroom, living_room, bathroom, garage, office, outdoor, other';
COMMENT ON COLUMN vault_items.tags IS 'Custom tags for filtering and organization';
COMMENT ON COLUMN vault_items.estimated_value IS 'Estimated value for insurance purposes (in currency specified)';
COMMENT ON COLUMN vault_items.expires_at IS 'Expiry date for warranties, insurance policies, or contracts';

COMMENT ON COLUMN insurance_packs.rooms_included IS 'Array of rooms included in multi-room packs';
COMMENT ON COLUMN insurance_packs.pdf_path IS 'Storage path to generated PDF summary';
COMMENT ON COLUMN insurance_packs.zip_path IS 'Storage path to generated ZIP archive with all documents';
