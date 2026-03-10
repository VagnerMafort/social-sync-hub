import { Youtube, Instagram } from 'lucide-react';
import type { Platform } from '@/types';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.21 8.21 0 0 0 4.76 1.51v-3.45a4.83 4.83 0 0 1-1-.08z"/>
  </svg>
);

export function PlatformIcon({ platform, className = 'h-4 w-4' }: { platform: Platform; className?: string }) {
  switch (platform) {
    case 'youtube': return <Youtube className={`${className} platform-youtube`} />;
    case 'instagram': return <Instagram className={`${className} platform-instagram`} />;
    case 'tiktok': return <TikTokIcon className={`${className} platform-tiktok`} />;
  }
}

export function platformLabel(platform: Platform): string {
  return { youtube: 'YouTube', instagram: 'Instagram', tiktok: 'TikTok' }[platform];
}
