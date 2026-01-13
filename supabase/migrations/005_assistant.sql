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
