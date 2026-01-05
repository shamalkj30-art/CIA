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
