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
