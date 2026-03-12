import { mySupabase } from '@/lib/supabase-client';
import type { Workspace, SocialAccount, MediaItem, ScheduledPost, QueueJob, AnalyticsData } from '@/types';

// ── Auth ──────────────────────────────────────────────────────────
export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const { data, error } = await mySupabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      return {
        token: data.session?.access_token ?? '',
        user: {
          id: data.user.id,
          email: data.user.email ?? '',
          full_name: data.user.user_metadata?.full_name ?? data.user.email?.split('@')[0] ?? '',
          avatar_url: data.user.user_metadata?.avatar_url,
        },
      };
    },
    signup: async (email: string, password: string, full_name: string) => {
      const { data, error } = await mySupabase.auth.signUp({
        email,
        password,
        options: { data: { full_name } },
      });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('Verifique seu email para confirmar o cadastro.');
      return {
        token: data.session?.access_token ?? '',
        user: {
          id: data.user.id,
          email: data.user.email ?? '',
          full_name,
        },
      };
    },
    me: async () => {
      const { data, error } = await mySupabase.auth.getUser();
      if (error) throw error;
      return {
        user: {
          id: data.user.id,
          email: data.user.email ?? '',
          full_name: data.user.user_metadata?.full_name ?? '',
          avatar_url: data.user.user_metadata?.avatar_url,
        },
      };
    },
    logout: async () => {
      await mySupabase.auth.signOut();
    },
  },

  // ── Workspaces ────────────────────────────────────────────────────
  workspaces: {
    list: async (): Promise<Workspace[]> => {
      const { data, error } = await mySupabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as Workspace[];
    },
    create: async (ws: Partial<Workspace>): Promise<Workspace> => {
      const { data: { user } } = await mySupabase.auth.getUser();
      const { data, error } = await mySupabase
        .from('workspaces')
        .insert({ name: ws.name, slug: ws.slug, owner_id: user?.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as unknown as Workspace;
    },
  },

  // ── Social Accounts ──────────────────────────────────────────────
  accounts: {
    list: async (workspaceId: string): Promise<SocialAccount[]> => {
      const { data, error } = await mySupabase
        .from('social_accounts')
        .select('*')
        .eq('workspace_id', workspaceId);
      if (error) throw new Error(error.message);
      return (data ?? []).map((a: any) => ({
        id: a.id,
        workspace_id: a.workspace_id,
        platform: a.platform,
        platform_username: a.account_name ?? a.platform_account_id ?? '',
        platform_avatar: a.account_avatar_url,
        status: a.status as any,
        connected_at: a.created_at,
      }));
    },
    connect: async (workspaceId: string, platform: string) => {
      // Uses the existing oauth-initiate edge function on Lovable Cloud
      const { data: { session } } = await mySupabase.auth.getSession();
      const res = await fetch(
        `https://kxtirluaooyvoqqneucu.supabase.co/functions/v1/oauth-initiate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            platform,
            workspace_id: workspaceId,
            redirect_uri: `${window.location.origin}/accounts`,
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to initiate OAuth');
      }
      return res.json();
    },
    disconnect: async (accountId: string) => {
      const { error } = await mySupabase
        .from('social_accounts')
        .delete()
        .eq('id', accountId);
      if (error) throw new Error(error.message);
    },
  },

  // ── Media ─────────────────────────────────────────────────────────
  media: {
    list: async (workspaceId: string): Promise<MediaItem[]> => {
      const { data, error } = await mySupabase
        .from('media')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as MediaItem[];
    },
    upload: async (workspaceId: string, file: File, _onProgress?: (p: number) => void): Promise<MediaItem> => {
      const path = `${workspaceId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await mySupabase.storage
        .from('media')
        .upload(path, file);
      if (uploadError) throw new Error(uploadError.message);

      const { data: { publicUrl } } = mySupabase.storage.from('media').getPublicUrl(path);

      const { data, error } = await mySupabase
        .from('media')
        .insert({
          workspace_id: workspaceId,
          filename: file.name,
          url: publicUrl,
          type: file.type.startsWith('video') ? 'video' : 'image',
          size: file.size,
          status: 'ready',
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as unknown as MediaItem;
    },
    delete: async (mediaId: string) => {
      const { error } = await mySupabase.from('media').delete().eq('id', mediaId);
      if (error) throw new Error(error.message);
    },
  },

  // ── Schedule ──────────────────────────────────────────────────────
  schedule: {
    list: async (workspaceId: string): Promise<ScheduledPost[]> => {
      const { data, error } = await mySupabase
        .from('scheduled_posts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('scheduled_at', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as ScheduledPost[];
    },
    create: async (post: Partial<ScheduledPost>): Promise<ScheduledPost> => {
      const { data, error } = await mySupabase
        .from('scheduled_posts')
        .insert(post)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as unknown as ScheduledPost;
    },
    update: async (id: string, post: Partial<ScheduledPost>): Promise<ScheduledPost> => {
      const { data, error } = await mySupabase
        .from('scheduled_posts')
        .update(post)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as unknown as ScheduledPost;
    },
    delete: async (id: string) => {
      const { error } = await mySupabase.from('scheduled_posts').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
  },

  // ── Queue ─────────────────────────────────────────────────────────
  queue: {
    list: async (workspaceId: string): Promise<QueueJob[]> => {
      const { data, error } = await mySupabase
        .from('queue_jobs')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as QueueJob[];
    },
    retry: async (jobId: string): Promise<QueueJob> => {
      const { data, error } = await mySupabase
        .from('queue_jobs')
        .update({ status: 'pending', attempts: 0 })
        .eq('id', jobId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as unknown as QueueJob;
    },
  },

  // ── Analytics (mock for now — no analytics table yet) ─────────────
  analytics: {
    get: async (_workspaceId: string, _period?: string): Promise<AnalyticsData> => {
      // Will be replaced when analytics table exists in your Supabase
      const { mockAnalytics } = await import('@/lib/mock-data');
      return mockAnalytics;
    },
  },
};
