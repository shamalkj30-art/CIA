# LLM Usage Tracking & Monitoring - Future Implementation

> **Status:** Planned (not yet implemented)
> **Priority:** High - implement before scaling to many users
> **Estimated effort:** 2-3 hours

## Overview

When Cyncro scales to many users, we need to track all LLM usage for:
- Cost monitoring and budgeting
- User quota management
- Performance monitoring
- Debugging and error tracking
- Provider reliability tracking

**Admin Panel:** Use Supabase dashboard (no custom panel needed initially)

---

## Database Schema

### Table 1: `llm_usage`

Tracks every LLM API call.

```sql
CREATE TABLE llm_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Request info
  provider TEXT NOT NULL, -- 'anthropic', 'openai', 'google'
  model TEXT NOT NULL, -- 'claude-sonnet-4-5-20250929', 'gpt-4o', etc.
  operation TEXT NOT NULL, -- 'chat', 'vision', 'extraction', 'cancel_kit', 'case_message'

  -- Token usage
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

  -- Cost (calculate based on provider pricing)
  cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,

  -- Performance
  latency_ms INTEGER, -- Time to complete request

  -- Status
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT, -- If failed, store error

  -- Context
  conversation_id UUID, -- For chat operations
  metadata JSONB, -- Additional context if needed

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_llm_usage_user_id ON llm_usage(user_id);
CREATE INDEX idx_llm_usage_created_at ON llm_usage(created_at DESC);
CREATE INDEX idx_llm_usage_operation ON llm_usage(operation);
CREATE INDEX idx_llm_usage_provider ON llm_usage(provider);
CREATE INDEX idx_llm_usage_user_date ON llm_usage(user_id, created_at);
```

### Table 2: `user_quotas`

Track and enforce user limits.

```sql
CREATE TABLE user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Limits (null = unlimited)
  daily_request_limit INTEGER DEFAULT 100,
  monthly_request_limit INTEGER DEFAULT 2000,
  daily_cost_limit_usd DECIMAL(10, 2) DEFAULT 1.00,
  monthly_cost_limit_usd DECIMAL(10, 2) DEFAULT 20.00,

  -- Current usage (reset daily/monthly via cron)
  daily_requests INTEGER DEFAULT 0,
  monthly_requests INTEGER DEFAULT 0,
  daily_cost_usd DECIMAL(10, 6) DEFAULT 0,
  monthly_cost_usd DECIMAL(10, 6) DEFAULT 0,

  -- Timestamps
  daily_reset_at TIMESTAMPTZ DEFAULT CURRENT_DATE,
  monthly_reset_at TIMESTAMPTZ DEFAULT DATE_TRUNC('month', CURRENT_DATE),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create quota record for new users
CREATE OR REPLACE FUNCTION create_user_quota()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_quotas (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_quota();
```

### Table 3: `llm_errors`

Detailed error logging for debugging.

```sql
CREATE TABLE llm_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  provider TEXT NOT NULL,
  model TEXT,
  operation TEXT NOT NULL,

  error_type TEXT, -- 'rate_limit', 'timeout', 'invalid_request', 'server_error'
  error_message TEXT,
  error_code TEXT,

  request_payload JSONB, -- Sanitized request (no PII)

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_llm_errors_created_at ON llm_errors(created_at DESC);
CREATE INDEX idx_llm_errors_provider ON llm_errors(provider);
```

---

## SQL Views for Supabase Dashboard

Create these views for easy querying in Supabase:

```sql
-- Daily cost summary
CREATE VIEW daily_costs AS
SELECT
  DATE(created_at) as date,
  provider,
  operation,
  COUNT(*) as requests,
  SUM(input_tokens) as input_tokens,
  SUM(output_tokens) as output_tokens,
  SUM(cost_usd) as total_cost,
  AVG(latency_ms) as avg_latency_ms,
  COUNT(*) FILTER (WHERE NOT success) as failures
FROM llm_usage
GROUP BY DATE(created_at), provider, operation
ORDER BY date DESC, total_cost DESC;

-- User usage summary (current month)
CREATE VIEW user_usage_summary AS
SELECT
  u.user_id,
  au.email,
  COUNT(*) as total_requests,
  SUM(u.cost_usd) as total_cost,
  AVG(u.latency_ms) as avg_latency,
  MAX(u.created_at) as last_request,
  COUNT(*) FILTER (WHERE NOT u.success) as failed_requests
FROM llm_usage u
LEFT JOIN auth.users au ON u.user_id = au.id
WHERE u.created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY u.user_id, au.email
ORDER BY total_cost DESC;

-- Top users by cost (for abuse detection)
CREATE VIEW top_users_by_cost AS
SELECT
  user_id,
  COUNT(*) as requests_today,
  SUM(cost_usd) as cost_today
FROM llm_usage
WHERE created_at >= CURRENT_DATE
GROUP BY user_id
ORDER BY cost_today DESC
LIMIT 20;

-- Provider reliability
CREATE VIEW provider_reliability AS
SELECT
  provider,
  DATE(created_at) as date,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE success) as successful,
  COUNT(*) FILTER (WHERE NOT success) as failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE success) / COUNT(*), 2) as success_rate,
  AVG(latency_ms) as avg_latency_ms
FROM llm_usage
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY provider, DATE(created_at)
ORDER BY date DESC, provider;

-- Hourly traffic pattern
CREATE VIEW hourly_traffic AS
SELECT
  DATE(created_at) as date,
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as requests,
  SUM(cost_usd) as cost
FROM llm_usage
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at), EXTRACT(HOUR FROM created_at)
ORDER BY date DESC, hour;
```

---

## Code Changes

### 1. Create Usage Tracker Utility

```typescript
// lib/llm-tracking.ts
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Cost per 1K tokens (update as pricing changes)
const PRICING = {
  anthropic: {
    'claude-sonnet-4-5-20250929': { input: 0.003, output: 0.015 },
    'claude-opus-4-20250514': { input: 0.015, output: 0.075 },
  },
  openai: {
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  },
  google: {
    'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
  },
}

interface TrackingParams {
  userId: string | null
  provider: string
  model: string
  operation: string
  inputTokens: number
  outputTokens: number
  latencyMs: number
  success: boolean
  errorMessage?: string
  conversationId?: string
  metadata?: Record<string, unknown>
}

export async function trackLLMUsage(params: TrackingParams) {
  const pricing = PRICING[params.provider]?.[params.model] || { input: 0.003, output: 0.015 }
  const cost = (params.inputTokens / 1000 * pricing.input) + (params.outputTokens / 1000 * pricing.output)

  try {
    await supabaseAdmin.from('llm_usage').insert({
      user_id: params.userId,
      provider: params.provider,
      model: params.model,
      operation: params.operation,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      cost_usd: cost,
      latency_ms: params.latencyMs,
      success: params.success,
      error_message: params.errorMessage,
      conversation_id: params.conversationId,
      metadata: params.metadata,
    })

    // Update user quota
    if (params.userId) {
      await supabaseAdmin.rpc('increment_user_quota', {
        p_user_id: params.userId,
        p_requests: 1,
        p_cost: cost,
      })
    }
  } catch (error) {
    console.error('Failed to track LLM usage:', error)
    // Don't throw - tracking failure shouldn't break the app
  }
}

export async function checkUserQuota(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const { data: quota } = await supabaseAdmin
    .from('user_quotas')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!quota) return { allowed: true }

  if (quota.daily_request_limit && quota.daily_requests >= quota.daily_request_limit) {
    return { allowed: false, reason: 'Daily request limit reached' }
  }

  if (quota.daily_cost_limit_usd && quota.daily_cost_usd >= quota.daily_cost_limit_usd) {
    return { allowed: false, reason: 'Daily cost limit reached' }
  }

  return { allowed: true }
}
```

### 2. Update LLM Provider to Auto-Track

Wrap the LLM calls to automatically track usage:

```typescript
// In lib/llm/anthropic.ts - update the chat method
async chat(messages: Message[], options?: ChatOptions): Promise<LLMResponse> {
  const startTime = Date.now()
  let success = true
  let errorMessage: string | undefined

  try {
    const response = await this.client.messages.create({...})

    // Track successful call
    await trackLLMUsage({
      userId: options?.userId || null,
      provider: 'anthropic',
      model: options?.model || this.getDefaultModel(),
      operation: options?.operation || 'chat',
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      latencyMs: Date.now() - startTime,
      success: true,
    })

    return {...}
  } catch (error) {
    success = false
    errorMessage = error.message

    // Track failed call
    await trackLLMUsage({
      userId: options?.userId || null,
      provider: 'anthropic',
      model: options?.model || this.getDefaultModel(),
      operation: options?.operation || 'chat',
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - startTime,
      success: false,
      errorMessage,
    })

    throw error
  }
}
```

### 3. Quota Reset Cron Job

```typescript
// app/api/cron/reset-quotas/route.ts
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(...)

  // Reset daily quotas
  await supabase
    .from('user_quotas')
    .update({
      daily_requests: 0,
      daily_cost_usd: 0,
      daily_reset_at: new Date().toISOString(),
    })
    .lt('daily_reset_at', new Date().toISOString().split('T')[0])

  // Reset monthly quotas (on 1st of month)
  const today = new Date()
  if (today.getDate() === 1) {
    await supabase
      .from('user_quotas')
      .update({
        monthly_requests: 0,
        monthly_cost_usd: 0,
        monthly_reset_at: new Date().toISOString(),
      })
      .lt('monthly_reset_at', today.toISOString().split('T')[0])
  }

  return Response.json({ success: true })
}
```

---

## Useful Supabase Queries

Save these for quick access in Supabase SQL editor:

```sql
-- TODAY'S SUMMARY
SELECT
  COUNT(*) as requests,
  SUM(cost_usd)::DECIMAL(10,2) as total_cost,
  AVG(latency_ms)::INTEGER as avg_latency,
  COUNT(*) FILTER (WHERE NOT success) as errors
FROM llm_usage
WHERE created_at >= CURRENT_DATE;

-- THIS MONTH'S COST BY OPERATION
SELECT
  operation,
  COUNT(*) as requests,
  SUM(cost_usd)::DECIMAL(10,2) as cost
FROM llm_usage
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY operation
ORDER BY cost DESC;

-- USERS APPROACHING QUOTA
SELECT
  q.user_id,
  au.email,
  q.daily_requests,
  q.daily_request_limit,
  q.daily_cost_usd::DECIMAL(10,2),
  q.daily_cost_limit_usd
FROM user_quotas q
JOIN auth.users au ON q.user_id = au.id
WHERE q.daily_requests > q.daily_request_limit * 0.8
   OR q.daily_cost_usd > q.daily_cost_limit_usd * 0.8;

-- RECENT ERRORS
SELECT
  created_at,
  provider,
  operation,
  error_type,
  error_message
FROM llm_errors
ORDER BY created_at DESC
LIMIT 20;

-- PROVIDER PERFORMANCE (LAST 24H)
SELECT
  provider,
  COUNT(*) as requests,
  AVG(latency_ms)::INTEGER as avg_latency,
  MAX(latency_ms) as max_latency,
  ROUND(100.0 * COUNT(*) FILTER (WHERE success) / COUNT(*), 1) as success_rate
FROM llm_usage
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY provider;
```

---

## Implementation Checklist

When ready to implement:

- [ ] Run database migration (create tables)
- [ ] Create SQL views in Supabase
- [ ] Add `lib/llm-tracking.ts` utility
- [ ] Update LLM providers to call tracking
- [ ] Add quota check before LLM calls
- [ ] Set up cron job for quota resets
- [ ] Test with a few requests
- [ ] Verify data appears in Supabase dashboard

---

## Future Enhancements

When you outgrow Supabase dashboard:

1. **Custom Admin Panel** - Build `/admin` pages with charts
2. **Email Alerts** - Notify when costs exceed thresholds
3. **Slack Integration** - Post daily summaries to Slack
4. **Grafana Dashboard** - For advanced visualization
5. **Cost Forecasting** - Predict monthly costs based on growth

---

*Document created: January 2026*
*Last updated: January 2026*
