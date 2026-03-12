
-- Platform enum
CREATE TYPE public.platform_type AS ENUM ('instagram', 'facebook', 'youtube', 'tiktok');

-- Social accounts table
CREATE TABLE public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id TEXT NOT NULL,
  platform platform_type NOT NULL,
  platform_account_id TEXT,
  account_name TEXT,
  account_avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OAuth tokens table (separate for security)
CREATE TABLE public.oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  scopes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(social_account_id)
);

-- Enable RLS
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

-- RLS: users can only see/manage their own accounts
CREATE POLICY "Users can view own social accounts"
  ON public.social_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own social accounts"
  ON public.social_accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own social accounts"
  ON public.social_accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own social accounts"
  ON public.social_accounts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS for oauth_tokens: only via social_account ownership
CREATE POLICY "Users can view own tokens"
  ON public.oauth_tokens FOR SELECT
  TO authenticated
  USING (
    social_account_id IN (
      SELECT id FROM public.social_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own tokens"
  ON public.oauth_tokens FOR INSERT
  TO authenticated
  WITH CHECK (
    social_account_id IN (
      SELECT id FROM public.social_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own tokens"
  ON public.oauth_tokens FOR UPDATE
  TO authenticated
  USING (
    social_account_id IN (
      SELECT id FROM public.social_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own tokens"
  ON public.oauth_tokens FOR DELETE
  TO authenticated
  USING (
    social_account_id IN (
      SELECT id FROM public.social_accounts WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_social_accounts_user_id ON public.social_accounts(user_id);
CREATE INDEX idx_social_accounts_workspace_id ON public.social_accounts(workspace_id);
CREATE INDEX idx_oauth_tokens_social_account_id ON public.oauth_tokens(social_account_id);
