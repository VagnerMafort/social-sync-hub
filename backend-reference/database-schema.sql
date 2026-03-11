-- ================================================
-- Database Schema — Mídias Mafort
-- PostgreSQL
-- ================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- 1. Users
-- ================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 2. Workspaces
-- ================================================
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- ================================================
-- 3. Social Accounts
-- ================================================
CREATE TYPE platform_type AS ENUM ('youtube', 'instagram', 'tiktok');
CREATE TYPE account_status AS ENUM ('connected', 'disconnected', 'expired');

CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  platform_username VARCHAR(255) NOT NULL,
  platform_avatar TEXT,
  platform_user_id VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  status account_status DEFAULT 'connected',
  connected_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 4. Media
-- ================================================
CREATE TYPE media_type AS ENUM ('video', 'image', 'carousel');
CREATE TYPE media_status AS ENUM ('uploading', 'processing', 'ready', 'error');

CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  type media_type NOT NULL,
  size BIGINT DEFAULT 0,
  duration INTEGER,
  width INTEGER,
  height INTEGER,
  status media_status DEFAULT 'ready',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 5. Scheduled Posts
-- ================================================
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'publishing', 'published', 'failed');

CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id) ON DELETE SET NULL,
  account_id UUID REFERENCES social_accounts(id) ON DELETE SET NULL,
  platform platform_type NOT NULL,
  caption TEXT DEFAULT '',
  hashtags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  scheduled_at TIMESTAMPTZ NOT NULL,
  status post_status DEFAULT 'draft',
  published_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 6. Queue Jobs
-- ================================================
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'retrying');

CREATE TABLE queue_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  status job_status DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- Indexes
-- ================================================
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_social_accounts_workspace ON social_accounts(workspace_id);
CREATE INDEX idx_media_workspace ON media(workspace_id);
CREATE INDEX idx_scheduled_posts_workspace ON scheduled_posts(workspace_id);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX idx_queue_jobs_post ON queue_jobs(post_id);
CREATE INDEX idx_queue_jobs_status ON queue_jobs(status);
