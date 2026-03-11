import type { Workspace, SocialAccount, MediaItem, ScheduledPost, QueueJob, AnalyticsData } from '@/types';

const API_BASE = 'https://midias.grupomafort.com';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || 'API Error');
  }
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    signup: (email: string, password: string, full_name: string) =>
      request<{ token: string; user: any }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name }),
      }),
    me: () => request<{ user: any }>('/auth/me'),
  },

  workspaces: {
    list: () => request<Workspace[]>('/workspaces'),
    create: (data: Partial<Workspace>) =>
      request<Workspace>('/workspaces', { method: 'POST', body: JSON.stringify(data) }),
  },

  accounts: {
    list: (workspaceId: string) =>
      request<SocialAccount[]>(`/accounts?workspace_id=${workspaceId}`),
    connect: (workspaceId: string, platform: string) =>
      request<{ oauth_url: string }>(`/accounts/connect`, {
        method: 'POST',
        body: JSON.stringify({ workspace_id: workspaceId, platform }),
      }),
    disconnect: (accountId: string) =>
      request<void>(`/accounts/${accountId}`, { method: 'DELETE' }),
  },

  media: {
    list: (workspaceId: string) =>
      request<MediaItem[]>(`/media?workspace_id=${workspaceId}`),
    upload: async (workspaceId: string, file: File, onProgress?: (p: number) => void) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspace_id', workspaceId);

      return new Promise<MediaItem>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/media/upload`);
        const token = localStorage.getItem('auth_token');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
          else reject(new Error('Upload failed'));
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(formData);
      });
    },
    delete: (mediaId: string) =>
      request<void>(`/media/${mediaId}`, { method: 'DELETE' }),
  },

  schedule: {
    list: (workspaceId: string) =>
      request<ScheduledPost[]>(`/schedule?workspace_id=${workspaceId}`),
    create: (data: Partial<ScheduledPost>) =>
      request<ScheduledPost>('/schedule', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ScheduledPost>) =>
      request<ScheduledPost>(`/schedule/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/schedule/${id}`, { method: 'DELETE' }),
  },

  queue: {
    list: (workspaceId: string) =>
      request<QueueJob[]>(`/queue?workspace_id=${workspaceId}`),
    retry: (jobId: string) =>
      request<QueueJob>(`/queue/${jobId}/retry`, { method: 'POST' }),
  },

  analytics: {
    get: (workspaceId: string, period?: string) =>
      request<AnalyticsData>(`/analytics?workspace_id=${workspaceId}&period=${period || '30d'}`),
  },
};
