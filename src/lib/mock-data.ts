import type { Workspace, SocialAccount, MediaItem, ScheduledPost, QueueJob, AnalyticsData, Notification } from '@/types';

export const mockWorkspaces: Workspace[] = [
  { id: 'ws-1', name: 'Acme Studios', slug: 'acme-studios', created_at: '2024-01-15T00:00:00Z' },
  { id: 'ws-2', name: 'Personal Brand', slug: 'personal-brand', created_at: '2024-03-10T00:00:00Z' },
];

export const mockAccounts: SocialAccount[] = [
  { id: 'acc-1', workspace_id: 'ws-1', platform: 'youtube', platform_username: 'AcmeStudios', status: 'connected', connected_at: '2024-02-01T00:00:00Z' },
  { id: 'acc-2', workspace_id: 'ws-1', platform: 'instagram', platform_username: '@acme_studios', status: 'connected', connected_at: '2024-02-05T00:00:00Z' },
  { id: 'acc-3', workspace_id: 'ws-1', platform: 'tiktok', platform_username: '@acmestudios', status: 'expired', connected_at: '2024-01-20T00:00:00Z' },
  { id: 'acc-4', workspace_id: 'ws-1', platform: 'instagram', platform_username: '@acme_behind_scenes', status: 'connected', connected_at: '2024-03-01T00:00:00Z' },
];

export const mockMedia: MediaItem[] = [
  { id: 'med-1', workspace_id: 'ws-1', filename: 'product-launch.mp4', url: '', thumbnail_url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=300&h=200&fit=crop', type: 'video', size: 52428800, duration: 120, width: 1920, height: 1080, status: 'ready', created_at: '2024-03-01T10:00:00Z', tags: ['product', 'launch'] },
  { id: 'med-2', workspace_id: 'ws-1', filename: 'behind-scenes.jpg', url: '', thumbnail_url: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=300&h=200&fit=crop', type: 'image', size: 2097152, width: 1080, height: 1080, status: 'ready', created_at: '2024-03-02T14:00:00Z', tags: ['bts'] },
  { id: 'med-3', workspace_id: 'ws-1', filename: 'tutorial-series-ep1.mp4', url: '', thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop', type: 'video', size: 104857600, duration: 600, width: 1920, height: 1080, status: 'ready', created_at: '2024-03-03T09:00:00Z', tags: ['tutorial'] },
  { id: 'med-4', workspace_id: 'ws-1', filename: 'summer-collection.jpg', url: '', thumbnail_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=200&fit=crop', type: 'image', size: 3145728, width: 1080, height: 1350, status: 'ready', created_at: '2024-03-04T16:00:00Z', tags: ['summer', 'collection'] },
  { id: 'med-5', workspace_id: 'ws-1', filename: 'team-intro.mp4', url: '', thumbnail_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&h=200&fit=crop', type: 'video', size: 78643200, duration: 45, width: 1080, height: 1920, status: 'processing', created_at: '2024-03-05T11:00:00Z', tags: ['team'] },
  { id: 'med-6', workspace_id: 'ws-1', filename: 'carousel-tips.jpg', url: '', thumbnail_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=300&h=200&fit=crop', type: 'carousel', size: 8388608, width: 1080, height: 1080, status: 'ready', created_at: '2024-03-05T15:00:00Z', tags: ['tips', 'carousel'] },
];

const today = new Date();
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString(); };

export const mockPosts: ScheduledPost[] = [
  { id: 'post-1', workspace_id: 'ws-1', media_id: 'med-1', account_id: 'acc-1', platform: 'youtube', caption: '🚀 Excited to announce our new product line! Check it out', hashtags: ['#newproduct', '#launch', '#excited'], scheduled_at: addDays(today, 1), status: 'scheduled', created_at: '2024-03-01T10:00:00Z' },
  { id: 'post-2', workspace_id: 'ws-1', media_id: 'med-2', account_id: 'acc-2', platform: 'instagram', caption: 'Behind the scenes of our latest shoot 📸', hashtags: ['#bts', '#behindthescenes'], scheduled_at: addDays(today, 2), status: 'scheduled', created_at: '2024-03-02T14:00:00Z' },
  { id: 'post-3', workspace_id: 'ws-1', media_id: 'med-3', account_id: 'acc-1', platform: 'youtube', caption: 'Tutorial Series Ep.1 — Getting Started', hashtags: ['#tutorial', '#howto'], scheduled_at: addDays(today, -1), status: 'published', published_url: 'https://youtube.com/watch?v=xxx', created_at: '2024-03-03T09:00:00Z' },
  { id: 'post-4', workspace_id: 'ws-1', media_id: 'med-4', account_id: 'acc-3', platform: 'tiktok', caption: 'Summer vibes ☀️🌊', hashtags: ['#summer', '#vibes', '#trending'], scheduled_at: addDays(today, 3), status: 'draft', created_at: '2024-03-04T16:00:00Z' },
  { id: 'post-5', workspace_id: 'ws-1', media_id: 'med-2', account_id: 'acc-4', platform: 'instagram', caption: 'Throwback to an amazing day!', hashtags: ['#throwback', '#memories'], scheduled_at: addDays(today, -3), status: 'failed', error_message: 'Rate limit exceeded', created_at: '2024-03-05T11:00:00Z' },
];

export const mockQueue: QueueJob[] = [
  { id: 'job-1', post_id: 'post-1', status: 'pending', attempts: 0, max_attempts: 3, created_at: addDays(today, 1) },
  { id: 'job-2', post_id: 'post-2', status: 'pending', attempts: 0, max_attempts: 3, created_at: addDays(today, 2) },
  { id: 'job-3', post_id: 'post-3', status: 'completed', attempts: 1, max_attempts: 3, started_at: addDays(today, -1), completed_at: addDays(today, -1), created_at: addDays(today, -1) },
  { id: 'job-4', post_id: 'post-5', status: 'failed', attempts: 3, max_attempts: 3, error: 'Rate limit exceeded', created_at: addDays(today, -3) },
];

export const mockAnalytics: AnalyticsData = {
  total_posts: 147,
  posts_this_week: 12,
  total_views: 284500,
  total_engagement: 18340,
  engagement_rate: 6.4,
  platform_breakdown: [
    { platform: 'youtube', posts: 52, views: 180000, engagement: 8200 },
    { platform: 'instagram', posts: 68, views: 72000, engagement: 7100 },
    { platform: 'tiktok', posts: 27, views: 32500, engagement: 3040 },
  ],
  daily_posts: Array.from({ length: 30 }, (_, i) => ({
    date: addDays(today, -29 + i).split('T')[0],
    count: Math.floor(Math.random() * 8) + 1,
  })),
  top_posts: [],
};

export const mockNotifications: Notification[] = [
  { id: 'n-1', type: 'success', title: 'Post Published', message: 'Tutorial Series Ep.1 was published to YouTube', read: false, created_at: addDays(today, -1) },
  { id: 'n-2', type: 'error', title: 'Post Failed', message: 'Throwback post failed on Instagram — rate limit', read: false, created_at: addDays(today, -3) },
  { id: 'n-3', type: 'warning', title: 'Account Expiring', message: 'TikTok account token expires in 3 days', read: true, created_at: addDays(today, -5) },
  { id: 'n-4', type: 'info', title: 'New Feature', message: 'Carousel scheduling is now available!', read: true, created_at: addDays(today, -7) },
];
