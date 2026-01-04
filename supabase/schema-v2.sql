-- Cyncro Database Schema V2 - Email Automation & Notifications
-- Run this in your Supabase SQL Editor AFTER the original schema

-- ============================================
-- UPDATE PURCHASES TABLE
-- ============================================
-- Add new columns for email automation
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
-- Values: 'manual', 'email_forwarded', 'gmail_auto'

ALTER TABLE purchases ADD COLUMN IF NOT EXISTS order_number TEXT;

ALTER TABLE purchases ADD COLUMN IF NOT EXISTS return_deadline DATE;

ALTER TABLE purchases ADD COLUMN IF NOT EXISTS email_metadata JSONB;
-- Stores: { subject, sender, received_at, gmail_message_id, confidence }

ALTER TABLE purchases ADD COLUMN IF NOT EXISTS auto_detected BOOLEAN DEFAULT false;

ALTER TABLE purchases ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT false;

-- Index for order number lookups (duplicate detection)
CREATE INDEX IF NOT EXISTS purchases_order_number_idx ON purchases(order_number);

-- ============================================
-- EMAIL CONNECTIONS TABLE (for OAuth tokens)
-- ============================================
CREATE TABLE IF NOT EXISTS email_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'gmail', -- 'gmail', 'outlook'
  email_address TEXT NOT NULL,
  access_token TEXT, -- encrypted in app layer
  refresh_token TEXT, -- encrypted in app layer
  token_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT true,
  history_id TEXT, -- Gmail history ID for incremental sync
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS email_connections_user_id_idx ON email_connections(user_id);

-- RLS for email_connections
ALTER TABLE email_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email connections"
  ON email_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email connections"
  ON email_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email connections"
  ON email_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email connections"
  ON email_connections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PROCESSED EMAILS TABLE (to avoid duplicates)
-- ============================================
CREATE TABLE IF NOT EXISTS processed_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id TEXT NOT NULL, -- Gmail message ID
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  result TEXT NOT NULL, -- 'created_purchase', 'ignored', 'failed', 'not_order'
  purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
  error_message TEXT,
  UNIQUE(user_id, email_id)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS processed_emails_user_email_idx ON processed_emails(user_id, email_id);

-- RLS for processed_emails
ALTER TABLE processed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own processed emails"
  ON processed_emails FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own processed emails"
  ON processed_emails FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'warranty_expiring', 'return_deadline', 'new_purchase', 'gmail_connected'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  expires_at TIMESTAMPTZ, -- When the notification becomes irrelevant
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user notifications
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- NOTIFICATION SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  warranty_expiring BOOLEAN DEFAULT true,
  warranty_expiring_days INTEGER DEFAULT 30, -- Days before expiry to notify
  return_deadline BOOLEAN DEFAULT true,
  return_deadline_days INTEGER DEFAULT 3, -- Days before deadline to notify
  new_purchase BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false, -- Future: send email notifications
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for notification_settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification settings"
  ON notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
  ON notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
  ON notification_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MERCHANTS TABLE (for better detection)
-- ============================================
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  email_domains TEXT[], -- ['amazon.com', 'amazon.co.uk']
  default_warranty_months INTEGER DEFAULT 12,
  default_return_days INTEGER DEFAULT 30,
  category TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common merchants
INSERT INTO merchants (name, email_domains, default_warranty_months, default_return_days, category) VALUES
  ('Amazon', ARRAY['amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.no'], 12, 30, 'Marketplace'),
  ('Apple', ARRAY['apple.com', 'email.apple.com'], 12, 14, 'Electronics'),
  ('IKEA', ARRAY['ikea.com', 'ikea.no'], 24, 365, 'Furniture'),
  ('Zara', ARRAY['zara.com', 'inditex.com'], 0, 30, 'Clothing'),
  ('H&M', ARRAY['hm.com', 'email.hm.com'], 0, 30, 'Clothing'),
  ('Nike', ARRAY['nike.com', 'email.nike.com'], 24, 60, 'Clothing'),
  ('Adidas', ARRAY['adidas.com', 'adidas.no'], 24, 30, 'Clothing'),
  ('Best Buy', ARRAY['bestbuy.com', 'emailinfo.bestbuy.com'], 12, 15, 'Electronics'),
  ('MediaMarkt', ARRAY['mediamarkt.com', 'mediamarkt.no', 'mediamarkt.de'], 24, 30, 'Electronics'),
  ('Elkjøp', ARRAY['elkjop.no', 'elgiganten.se'], 24, 60, 'Electronics'),
  ('Komplett', ARRAY['komplett.no', 'komplett.se'], 24, 30, 'Electronics'),
  ('Zalando', ARRAY['zalando.com', 'zalando.no', 'zalando.de'], 0, 100, 'Clothing'),
  ('ASOS', ARRAY['asos.com'], 0, 28, 'Clothing'),
  ('Booking.com', ARRAY['booking.com'], 0, 0, 'Travel'),
  ('Airbnb', ARRAY['airbnb.com'], 0, 0, 'Travel')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- FUNCTION: Create default notification settings
-- ============================================
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create settings for new users
DROP TRIGGER IF EXISTS on_auth_user_created_notification_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_settings();

-- ============================================
-- UPDATE TRIGGER FOR email_connections
-- ============================================
CREATE TRIGGER update_email_connections_updated_at
  BEFORE UPDATE ON email_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

