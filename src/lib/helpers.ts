import type { ScheduledPost, QueueJob, MediaItem, SocialAccount } from '@/types';

export function postStatusChipClass(status: ScheduledPost['status']): string {
  switch (status) {
    case 'published': return 'status-chip-success';
    case 'scheduled': return 'status-chip-info';
    case 'publishing': return 'status-chip-warning';
    case 'failed': return 'status-chip-destructive';
    case 'draft': return 'status-chip-muted';
  }
}

export function queueStatusChipClass(status: QueueJob['status']): string {
  switch (status) {
    case 'completed': return 'status-chip-success';
    case 'processing': return 'status-chip-info';
    case 'pending': return 'status-chip-muted';
    case 'retrying': return 'status-chip-warning';
    case 'failed': return 'status-chip-destructive';
  }
}

export function mediaStatusChipClass(status: MediaItem['status']): string {
  switch (status) {
    case 'ready': return 'status-chip-success';
    case 'processing': return 'status-chip-warning';
    case 'uploading': return 'status-chip-info';
    case 'error': return 'status-chip-destructive';
  }
}

export function accountStatusChipClass(status: SocialAccount['status']): string {
  switch (status) {
    case 'connected': return 'status-chip-success';
    case 'disconnected': return 'status-chip-muted';
    case 'expired': return 'status-chip-destructive';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
