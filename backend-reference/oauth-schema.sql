-- =============================================
-- SQL to run on your VPS PostgreSQL database
-- Creates the tables needed for OAuth
-- =============================================

-- Social accounts table
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL,
  platform_account_id TEXT,
  account_name TEXT,
  account_avatar_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'connected',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, workspace_id, platform, platform_account_id)
);

-- OAuth tokens table (separate for security)
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  scopes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(social_account_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_workspace ON social_accounts(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_account ON oauth_tokens(social_account_id);
