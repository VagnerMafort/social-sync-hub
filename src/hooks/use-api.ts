import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/app-store';
import {
  mockWorkspaces, mockAccounts, mockMedia, mockPosts, mockQueue, mockAnalytics,
} from '@/lib/mock-data';
import type { ScheduledPost } from '@/types';

function useWorkspaceId() {
  return useAppStore((s) => s.currentWorkspace?.id) ?? '';
}

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      try { return await api.workspaces.list(); }
      catch { return mockWorkspaces; }
    },
  });
}

export function useAccounts() {
  const wsId = useWorkspaceId();
  return useQuery({
    queryKey: ['accounts', wsId],
    queryFn: async () => {
      if (!wsId) return mockAccounts;
      try { return await api.accounts.list(wsId); }
      catch { return mockAccounts; }
    },
  });
}

export function useMedia() {
  const wsId = useWorkspaceId();
  return useQuery({
    queryKey: ['media', wsId],
    queryFn: async () => {
      if (!wsId) return mockMedia;
      try { return await api.media.list(wsId); }
      catch { return mockMedia; }
    },
  });
}

export function usePosts() {
  const wsId = useWorkspaceId();
  return useQuery({
    queryKey: ['posts', wsId],
    queryFn: async () => {
      if (!wsId) return mockPosts;
      try { return await api.schedule.list(wsId); }
      catch { return mockPosts; }
    },
  });
}

export function useQueue() {
  const wsId = useWorkspaceId();
  return useQuery({
    queryKey: ['queue', wsId],
    queryFn: async () => {
      if (!wsId) return mockQueue;
      try { return await api.queue.list(wsId); }
      catch { return mockQueue; }
    },
  });
}

export function useAnalytics(period?: string) {
  const wsId = useWorkspaceId();
  return useQuery({
    queryKey: ['analytics', wsId, period],
    queryFn: async () => {
      if (!wsId) return mockAnalytics;
      try { return await api.analytics.get(wsId, period); }
      catch { return mockAnalytics; }
    },
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ScheduledPost>) => api.schedule.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['posts'] }); },
  });
}

export function useRetryJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => api.queue.retry(jobId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['queue'] }); },
  });
}

export function useUploadMedia() {
  const wsId = useWorkspaceId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (p: number) => void }) =>
      api.media.upload(wsId, file, onProgress),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['media'] }); },
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: string) => api.media.delete(mediaId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['media'] }); },
  });
}

export function useDisconnectAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) => api.accounts.disconnect(accountId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); },
  });
}
