-- ============================================================
-- CYNCRO: full fresh install SQL
-- Generated from all migrations + storage policies.
-- Paste this into Supabase Dashboard → SQL Editor → Run.
-- Idempotent: safe to re-run.
-- ============================================================


-- ╔══════════════════════════════════════════════════════════
-- ║  schema.sql
-- ╚══════════════════════════════════════════════════════════
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
  warranty_expires_at DATE,
  category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
-- MIGRATION: Run this if you have an existing database
-- ============================================
-- If warranty_expires_at is a generated column, you need to drop and recreate it:
-- 
-- Step 1: Drop the generated column
-- ALTER TABLE purchases DROP COLUMN IF EXISTS warranty_expires_at;
-- 
-- Step 2: Add it as a regular column
-- ALTER TABLE purchases ADD COLUMN warranty_expires_at DATE;
-- 
-- Step 3: Add the other new columns
-- ALTER TABLE purchases ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
-- ALTER TABLE purchases ADD COLUMN IF NOT EXISTS category TEXT;
-- ALTER TABLE purchases ADD COLUMN IF NOT EXISTS notes TEXT;
-- 
-- Step 4: Backfill warranty_expires_at for existing records (optional)
-- UPDATE purchases 
-- SET warranty_expires_at = purchase_date + (warranty_months * INTERVAL '1 month')::interval
-- WHERE warranty_months > 0 AND warranty_expires_at IS NULL;

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


-- ╔══════════════════════════════════════════════════════════
-- ║  schema-v2.sql
-- ╚══════════════════════════════════════════════════════════
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



-- ╔══════════════════════════════════════════════════════════
-- ║  001_subscriptions.sql
-- ╚══════════════════════════════════════════════════════════
-- Migration: 001_subscriptions
-- Description: Add subscriptions and subscription alerts tables
-- Date: 2026-01-05

-- =============================================================================
-- SUBSCRIPTIONS TABLE
-- =============================================================================
-- Stores recurring payment/subscription information

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Merchant info
  merchant TEXT NOT NULL,
  plan_name TEXT,
  logo_url TEXT,

  -- Billing details
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'NOK',
  cadence TEXT NOT NULL CHECK (cadence IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),

  -- Charge dates
  next_charge_date DATE,
  last_charge_date DATE,

  -- Trust/confidence level for the renewal date
  renewal_confidence TEXT DEFAULT 'estimated' CHECK (renewal_confidence IN ('confirmed', 'estimated', 'needs_confirmation')),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),

  -- Contact/cancel info
  cancel_url TEXT,
  support_email TEXT,
  support_phone TEXT,

  -- Category for organization
  category TEXT,

  -- Notes
  notes TEXT,

  -- Source tracking (how was this detected?)
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'gmail_auto', 'bank_import')),
  email_metadata JSONB,
  auto_detected BOOLEAN DEFAULT false,
  needs_review BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);

-- Index for upcoming charges (dashboard "next 7 days" queries)
CREATE INDEX IF NOT EXISTS subscriptions_next_charge_idx ON subscriptions(next_charge_date)
  WHERE status = 'active';

-- Index for status filtering
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(user_id, status);

-- =============================================================================
-- SUBSCRIPTION ALERTS TABLE
-- =============================================================================
-- Pre-computed alerts for upcoming charges ("Netflix charges tomorrow")

CREATE TABLE IF NOT EXISTS subscription_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Alert type: how many days before charge
  alert_type TEXT NOT NULL CHECK (alert_type IN ('7_day', '3_day', '1_day', 'day_of')),

  -- When to send this alert
  alert_date DATE NOT NULL,

  -- Tracking
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cron job to find unsent alerts for today
CREATE INDEX IF NOT EXISTS subscription_alerts_pending_idx
  ON subscription_alerts(alert_date)
  WHERE NOT sent;

-- Index for user's alerts
CREATE INDEX IF NOT EXISTS subscription_alerts_user_idx ON subscription_alerts(user_id);

-- =============================================================================
-- SUBSCRIPTION HISTORY TABLE
-- =============================================================================
-- Track price changes, renewals, etc.

CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'price_change', 'renewed', 'cancelled', 'reactivated', 'updated')),

  -- Store old/new values for price changes etc.
  old_value JSONB,
  new_value JSONB,

  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscription_history_sub_idx ON subscription_history(subscription_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Subscription alerts policies
CREATE POLICY "Users can view own subscription alerts"
  ON subscription_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription alerts"
  ON subscription_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription alerts"
  ON subscription_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscription alerts"
  ON subscription_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Subscription history policies (read-only for users, system inserts)
CREATE POLICY "Users can view own subscription history"
  ON subscription_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.id = subscription_history.subscription_id
      AND subscriptions.user_id = auth.uid()
    )
  );

-- =============================================================================
-- NOTIFICATION SETTINGS UPDATE
-- =============================================================================
-- Add subscription alert settings to existing notification_settings table

ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS subscription_charge_7_day BOOLEAN DEFAULT true;

ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS subscription_charge_3_day BOOLEAN DEFAULT true;

ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS subscription_charge_1_day BOOLEAN DEFAULT true;

ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS subscription_charge_day_of BOOLEAN DEFAULT false;

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- AUTO-CREATE ALERTS FUNCTION
-- =============================================================================
-- When a subscription is created/updated with a next_charge_date, create alerts

CREATE OR REPLACE FUNCTION create_subscription_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete existing unsent alerts for this subscription
  DELETE FROM subscription_alerts
  WHERE subscription_id = NEW.id AND NOT sent;

  -- Only create alerts if there's a next charge date and status is active
  IF NEW.next_charge_date IS NOT NULL AND NEW.status = 'active' THEN
    -- 7-day alert
    INSERT INTO subscription_alerts (subscription_id, user_id, alert_type, alert_date)
    SELECT NEW.id, NEW.user_id, '7_day', NEW.next_charge_date - INTERVAL '7 days'
    WHERE NEW.next_charge_date - INTERVAL '7 days' >= CURRENT_DATE;

    -- 3-day alert
    INSERT INTO subscription_alerts (subscription_id, user_id, alert_type, alert_date)
    SELECT NEW.id, NEW.user_id, '3_day', NEW.next_charge_date - INTERVAL '3 days'
    WHERE NEW.next_charge_date - INTERVAL '3 days' >= CURRENT_DATE;

    -- 1-day alert (tomorrow)
    INSERT INTO subscription_alerts (subscription_id, user_id, alert_type, alert_date)
    SELECT NEW.id, NEW.user_id, '1_day', NEW.next_charge_date - INTERVAL '1 day'
    WHERE NEW.next_charge_date - INTERVAL '1 day' >= CURRENT_DATE;

    -- Day-of alert
    INSERT INTO subscription_alerts (subscription_id, user_id, alert_type, alert_date)
    SELECT NEW.id, NEW.user_id, 'day_of', NEW.next_charge_date
    WHERE NEW.next_charge_date >= CURRENT_DATE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_alerts_on_subscription_change
  AFTER INSERT OR UPDATE OF next_charge_date, status ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION create_subscription_alerts();


-- ╔══════════════════════════════════════════════════════════
-- ║  002_cases.sql
-- ╚══════════════════════════════════════════════════════════
-- =============================================================================
-- CASES SYSTEM MIGRATION
-- =============================================================================
-- This migration creates tables for the Cases system, which tracks:
-- - Return requests
-- - Warranty claims
-- - Complaints
-- - Subscription cancellations
--
-- Run this SQL in the Supabase SQL Editor after 001_subscriptions.sql
-- =============================================================================

-- =============================================================================
-- CASES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Link to related purchase or subscription (optional)
  purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Case details
  case_type TEXT NOT NULL CHECK (case_type IN ('return', 'warranty', 'complaint', 'cancellation')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'waiting', 'escalated', 'resolved', 'closed')),

  -- Subject and description
  subject TEXT NOT NULL,
  description TEXT,

  -- Merchant contact info
  merchant TEXT NOT NULL,
  merchant_email TEXT,
  merchant_phone TEXT,

  -- Tracking
  reference_number TEXT, -- Case/ticket number from merchant

  -- Follow-up automation
  follow_up_at TIMESTAMPTZ, -- When to send reminder
  escalation_at TIMESTAMPTZ, -- When to escalate
  auto_follow_up BOOLEAN DEFAULT true,

  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  resolution_outcome TEXT CHECK (resolution_outcome IN ('refund_full', 'refund_partial', 'replacement', 'repair', 'rejected', 'withdrawn', 'other')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CASE EVENTS TABLE (Timeline)
-- =============================================================================

CREATE TABLE IF NOT EXISTS case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created',
    'message_sent',
    'message_received',
    'status_change',
    'escalation',
    'follow_up_sent',
    'note',
    'attachment_added',
    'resolved'
  )),

  -- Content (message text, notes, etc.)
  content TEXT,

  -- For status changes
  old_status TEXT,
  new_status TEXT,

  -- For attachments
  attachment_path TEXT,
  attachment_name TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CASE MESSAGES TABLE (Draft messages for copy/paste)
-- =============================================================================

CREATE TABLE IF NOT EXISTS case_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Message details
  message_type TEXT NOT NULL CHECK (message_type IN ('initial', 'follow_up', 'escalation', 'custom')),
  subject TEXT,
  body TEXT NOT NULL,

  -- AI generation metadata
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,

  -- Usage tracking
  copied_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_messages ENABLE ROW LEVEL SECURITY;

-- Cases policies
CREATE POLICY "Users can view their own cases"
  ON cases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cases"
  ON cases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cases"
  ON cases FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cases"
  ON cases FOR DELETE
  USING (auth.uid() = user_id);

-- Case events policies
CREATE POLICY "Users can view their own case events"
  ON case_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own case events"
  ON case_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Case messages policies
CREATE POLICY "Users can view their own case messages"
  ON case_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own case messages"
  ON case_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own case messages"
  ON case_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own case messages"
  ON case_messages FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_cases_user_id ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_case_type ON cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_follow_up_at ON cases(follow_up_at) WHERE follow_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_purchase_id ON cases(purchase_id) WHERE purchase_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_subscription_id ON cases(subscription_id) WHERE subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_case_events_case_id ON case_events(case_id);
CREATE INDEX IF NOT EXISTS idx_case_events_created_at ON case_events(created_at);

CREATE INDEX IF NOT EXISTS idx_case_messages_case_id ON case_messages(case_id);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_cases_updated_at();

-- =============================================================================
-- AUTO-CREATE CASE EVENT ON STATUS CHANGE
-- =============================================================================

CREATE OR REPLACE FUNCTION create_case_status_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create event if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO case_events (case_id, user_id, event_type, old_status, new_status, content)
    VALUES (
      NEW.id,
      NEW.user_id,
      'status_change',
      OLD.status,
      NEW.status,
      'Status changed from ' || COALESCE(OLD.status, 'none') || ' to ' || NEW.status
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER case_status_change_event
  AFTER UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION create_case_status_event();

-- =============================================================================
-- AUTO-SET FOLLOW-UP DATE ON CREATE
-- =============================================================================

CREATE OR REPLACE FUNCTION set_case_follow_up_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Set default follow-up to 3 days from now if not specified and auto_follow_up is enabled
  IF NEW.follow_up_at IS NULL AND NEW.auto_follow_up = true AND NEW.status = 'sent' THEN
    NEW.follow_up_at = NOW() + INTERVAL '3 days';
  END IF;

  -- Set escalation to 7 days from now if not specified
  IF NEW.escalation_at IS NULL AND NEW.status = 'sent' THEN
    NEW.escalation_at = NOW() + INTERVAL '7 days';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER case_set_follow_up
  BEFORE INSERT OR UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION set_case_follow_up_date();

-- =============================================================================
-- NOTIFICATION SETTINGS FOR CASES
-- =============================================================================

-- Add case notification columns to notification_settings
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS case_follow_up BOOLEAN DEFAULT true;

ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS case_escalation BOOLEAN DEFAULT true;

ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS case_resolved BOOLEAN DEFAULT true;

-- =============================================================================
-- SERVICE ROLE ACCESS (for cron jobs)
-- =============================================================================

CREATE POLICY "Service role can view all cases for cron"
  ON cases FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can update all cases for cron"
  ON cases FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can view all case events for cron"
  ON case_events FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can create case events for cron"
  ON case_events FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- =============================================================================
-- DONE
-- =============================================================================


-- ╔══════════════════════════════════════════════════════════
-- ║  003_vault.sql
-- ╚══════════════════════════════════════════════════════════
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


-- ╔══════════════════════════════════════════════════════════
-- ║  004_cancel_guides.sql
-- ╚══════════════════════════════════════════════════════════
-- ============================================
-- CANCEL GUIDES CACHE TABLE
-- ============================================
-- Caches AI-generated cancellation guides to reduce API calls
-- and provide faster responses for popular services

-- Drop existing table if exists (for clean migration)
DROP TABLE IF EXISTS cancel_guides CASCADE;

-- Create cancel_guides table
CREATE TABLE cancel_guides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Merchant identifier (lowercase, unique)
  merchant TEXT NOT NULL UNIQUE,
  merchant_normalized TEXT NOT NULL, -- lowercase version for matching

  -- Cancellation data
  steps JSONB NOT NULL DEFAULT '[]',
  cancel_url TEXT,
  support_url TEXT,
  support_email TEXT,
  support_phone TEXT,
  special_requirements TEXT,

  -- Verification metadata
  source TEXT NOT NULL DEFAULT 'ai_generated' CHECK (source IN ('web_search', 'cached', 'ai_generated')),
  confidence TEXT NOT NULL DEFAULT 'low' CHECK (confidence IN ('high', 'medium', 'low')),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Cache expiration (24 hours by default)
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast merchant lookups
CREATE INDEX idx_cancel_guides_merchant_normalized ON cancel_guides(merchant_normalized);
CREATE INDEX idx_cancel_guides_expires_at ON cancel_guides(expires_at);

-- Function to normalize merchant name
CREATE OR REPLACE FUNCTION normalize_merchant(merchant_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(TRIM(merchant_name));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-set merchant_normalized
CREATE OR REPLACE FUNCTION set_merchant_normalized()
RETURNS TRIGGER AS $$
BEGIN
  NEW.merchant_normalized := normalize_merchant(NEW.merchant);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_merchant_normalized ON cancel_guides;
CREATE TRIGGER trigger_set_merchant_normalized
  BEFORE INSERT OR UPDATE ON cancel_guides
  FOR EACH ROW
  EXECUTE FUNCTION set_merchant_normalized();

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_cancel_guides_updated_at ON cancel_guides;
CREATE TRIGGER update_cancel_guides_updated_at
  BEFORE UPDATE ON cancel_guides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE cancel_guides ENABLE ROW LEVEL SECURITY;

-- RLS policies (cancel guides are public read, admin write)
-- Since this is cached data from web searches, it can be shared across users
DROP POLICY IF EXISTS "Cancel guides are publicly readable" ON cancel_guides;
CREATE POLICY "Cancel guides are publicly readable"
  ON cancel_guides FOR SELECT
  USING (true);

-- Only service role can insert/update (from API routes)
DROP POLICY IF EXISTS "Service role can manage cancel guides" ON cancel_guides;
CREATE POLICY "Service role can manage cancel guides"
  ON cancel_guides FOR ALL
  USING (auth.role() = 'service_role');

-- Function to get or refresh cancel guide
CREATE OR REPLACE FUNCTION get_cancel_guide(merchant_name TEXT)
RETURNS TABLE (
  id UUID,
  merchant TEXT,
  steps JSONB,
  cancel_url TEXT,
  support_url TEXT,
  support_email TEXT,
  support_phone TEXT,
  source TEXT,
  confidence TEXT,
  verified_at TIMESTAMPTZ,
  is_expired BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cg.id,
    cg.merchant,
    cg.steps,
    cg.cancel_url,
    cg.support_url,
    cg.support_email,
    cg.support_phone,
    cg.source,
    cg.confidence,
    cg.verified_at,
    cg.expires_at < NOW() AS is_expired
  FROM cancel_guides cg
  WHERE cg.merchant_normalized = normalize_merchant(merchant_name);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA FOR COMMON SERVICES
-- ============================================
-- Pre-populate with known cancel URLs for popular services
-- These will be refreshed by the AI when accessed

INSERT INTO cancel_guides (merchant, steps, cancel_url, source, confidence, expires_at)
VALUES
  ('Netflix',
   '[{"step_number": 1, "title": "Go to Account", "description": "Sign in to Netflix and click your profile icon, then select Account", "action_type": "navigate", "action_url": "https://www.netflix.com/youraccount"}, {"step_number": 2, "title": "Cancel Membership", "description": "Click Cancel Membership under Membership & Billing", "action_type": "click"}, {"step_number": 3, "title": "Confirm", "description": "Click Finish Cancellation to confirm", "action_type": "click"}]',
   'https://www.netflix.com/cancelplan',
   'web_search',
   'high',
   NOW() + INTERVAL '7 days'),

  ('Spotify',
   '[{"step_number": 1, "title": "Go to Account", "description": "Log in to your Spotify account page", "action_type": "navigate", "action_url": "https://www.spotify.com/account/subscription/"}, {"step_number": 2, "title": "Change Plan", "description": "Click Change plan and scroll down", "action_type": "click"}, {"step_number": 3, "title": "Cancel", "description": "Click Cancel Premium at the bottom", "action_type": "click"}]',
   'https://www.spotify.com/account/subscription/',
   'web_search',
   'high',
   NOW() + INTERVAL '7 days'),

  ('Amazon Prime',
   '[{"step_number": 1, "title": "Go to Prime", "description": "Sign in to Amazon and go to Prime Membership page", "action_type": "navigate", "action_url": "https://www.amazon.com/mc/pipelines/cancelPrime"}, {"step_number": 2, "title": "End Membership", "description": "Click End membership and benefits", "action_type": "click"}, {"step_number": 3, "title": "Confirm", "description": "Follow prompts and select refund option if eligible", "action_type": "click"}]',
   'https://www.amazon.com/mc/pipelines/cancelPrime',
   'web_search',
   'high',
   NOW() + INTERVAL '7 days'),

  ('Disney+',
   '[{"step_number": 1, "title": "Go to Account", "description": "Log in to Disney+ and go to Account settings", "action_type": "navigate", "action_url": "https://www.disneyplus.com/account"}, {"step_number": 2, "title": "Subscription", "description": "Click on your subscription under Subscription", "action_type": "click"}, {"step_number": 3, "title": "Cancel", "description": "Click Cancel Subscription and confirm", "action_type": "click"}]',
   'https://www.disneyplus.com/account/subscription',
   'web_search',
   'high',
   NOW() + INTERVAL '7 days'),

  ('HBO Max',
   '[{"step_number": 1, "title": "Go to Settings", "description": "Log in to Max and go to Settings", "action_type": "navigate", "action_url": "https://www.max.com/settings"}, {"step_number": 2, "title": "Subscription", "description": "Click Subscription under your account", "action_type": "click"}, {"step_number": 3, "title": "Cancel", "description": "Click Cancel Subscription and confirm", "action_type": "click"}]',
   'https://www.max.com/account/subscription',
   'web_search',
   'high',
   NOW() + INTERVAL '7 days'),

  ('YouTube Premium',
   '[{"step_number": 1, "title": "Go to Memberships", "description": "Go to your YouTube paid memberships page", "action_type": "navigate", "action_url": "https://www.youtube.com/paid_memberships"}, {"step_number": 2, "title": "Manage", "description": "Click Manage membership next to YouTube Premium", "action_type": "click"}, {"step_number": 3, "title": "Deactivate", "description": "Click Deactivate and follow the prompts", "action_type": "click"}]',
   'https://www.youtube.com/paid_memberships',
   'web_search',
   'high',
   NOW() + INTERVAL '7 days'),

  ('Apple One',
   '[{"step_number": 1, "title": "Open Settings", "description": "On iPhone/iPad, go to Settings > your name > Subscriptions", "action_type": "navigate"}, {"step_number": 2, "title": "Select Apple One", "description": "Tap Apple One subscription", "action_type": "click"}, {"step_number": 3, "title": "Cancel", "description": "Tap Cancel Subscription and confirm", "action_type": "click"}]',
   'https://support.apple.com/en-us/HT202039',
   'web_search',
   'high',
   NOW() + INTERVAL '7 days')
ON CONFLICT (merchant) DO UPDATE SET
  steps = EXCLUDED.steps,
  cancel_url = EXCLUDED.cancel_url,
  source = EXCLUDED.source,
  confidence = EXCLUDED.confidence,
  expires_at = EXCLUDED.expires_at,
  updated_at = NOW();

-- ============================================
-- CLEANUP JOB (optional - run periodically)
-- ============================================
-- Delete expired entries older than 7 days
-- This can be run by a cron job

-- CREATE OR REPLACE FUNCTION cleanup_expired_cancel_guides()
-- RETURNS void AS $$
-- BEGIN
--   DELETE FROM cancel_guides
--   WHERE expires_at < NOW() - INTERVAL '7 days';
-- END;
-- $$ LANGUAGE plpgsql;


-- ╔══════════════════════════════════════════════════════════
-- ║  005_assistant.sql
-- ╚══════════════════════════════════════════════════════════
-- Migration: 005_assistant
-- Description: Add tables for AI Assistant conversation history
-- Date: 2026-01-13

-- =============================================================================
-- CONVERSATIONS TABLE
-- =============================================================================
-- Stores conversation sessions

CREATE TABLE IF NOT EXISTS assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Title (auto-generated from first message or user-set)
  title TEXT,

  -- Context at conversation start
  started_page TEXT,
  context_type TEXT CHECK (context_type IN ('global', 'purchase', 'subscription', 'case', 'vault_item')),
  context_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user's conversations
CREATE INDEX IF NOT EXISTS assistant_conversations_user_idx
  ON assistant_conversations(user_id, last_message_at DESC);

-- =============================================================================
-- MESSAGES TABLE
-- =============================================================================
-- Stores individual messages in conversations

CREATE TABLE IF NOT EXISTS assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,

  -- Tool calls made during this message (for assistant messages)
  tool_calls JSONB,

  -- Metadata
  tokens_used INTEGER,
  model TEXT DEFAULT 'claude-sonnet-4-5-20250929',

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for conversation messages
CREATE INDEX IF NOT EXISTS assistant_messages_conversation_idx
  ON assistant_messages(conversation_id, created_at);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view own conversations"
  ON assistant_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON assistant_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON assistant_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON assistant_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view own messages"
  ON assistant_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON assistant_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ============================================
-- STORAGE: receipts bucket + RLS policies
-- (the app uploads receipt PDFs/images into per-user folders here)
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Users can upload only into their own folder
DROP POLICY IF EXISTS "Users can upload own receipts" ON storage.objects;
CREATE POLICY "Users can upload own receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can read only their own files
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
CREATE POLICY "Users can view own receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete only their own files
DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;
CREATE POLICY "Users can delete own receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
