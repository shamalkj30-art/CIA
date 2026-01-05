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
