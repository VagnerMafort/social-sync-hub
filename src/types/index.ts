export type Platform = 'youtube' | 'instagram' | 'tiktok';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  avatar_url?: string;
  created_at: string;
}

export interface SocialAccount {
  id: string;
  workspace_id: string;
  platform: Platform;
  platform_username: string;
  platform_avatar?: string;
  status: 'connected' | 'disconnected' | 'expired';
  connected_at: string;
}

export interface MediaItem {
  id: string;
  workspace_id: string;
  filename: string;
  url: string;
  thumbnail_url?: string;
  type: 'video' | 'image' | 'carousel';
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  upload_progress?: number;
  created_at: string;
  tags?: string[];
}

export interface ScheduledPost {
  id: string;
  workspace_id: string;
  media_id: string;
  media?: MediaItem;
  account_id: string;
  account?: SocialAccount;
  platform: Platform;
  caption: string;
  hashtags: string[];
  metadata?: Record<string, unknown>;
  scheduled_at: string;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  published_url?: string;
  error_message?: string;
  created_at: string;
}

export interface QueueJob {
  id: string;
  post_id: string;
  post?: ScheduledPost;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  attempts: number;
  max_attempts: number;
  started_at?: string;
  completed_at?: string;
  error?: string;
  created_at: string;
}

export interface AnalyticsData {
  total_posts: number;
  posts_this_week: number;
  total_views: number;
  total_engagement: number;
  engagement_rate: number;
  platform_breakdown: {
    platform: Platform;
    posts: number;
    views: number;
    engagement: number;
  }[];
  daily_posts: { date: string; count: number }[];
  top_posts: ScheduledPost[];
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}
