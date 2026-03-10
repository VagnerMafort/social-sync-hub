import { useState } from 'react';
import { Plus, RefreshCw, Trash2, ExternalLink, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { mockAccounts } from '@/lib/mock-data';
import { PlatformIcon, platformLabel } from '@/components/PlatformIcon';
import { accountStatusChipClass } from '@/lib/helpers';
import type { Platform, SocialAccount } from '@/types';
import { cn } from '@/lib/utils';

const platformConfigs: { platform: Platform; color: string; description: string }[] = [
  { platform: 'youtube', color: 'hsl(0 100% 50%)', description: 'Connect your YouTube channel to schedule videos and shorts' },
  { platform: 'instagram', color: 'hsl(326 78% 55%)', description: 'Connect Instagram to schedule posts, stories, and reels' },
  { platform: 'tiktok', color: 'hsl(var(--foreground))', description: 'Connect TikTok to schedule video content' },
];

const statusIcons = {
  connected: CheckCircle2,
  expired: AlertCircle,
  disconnected: XCircle,
};

export default function AccountsPage() {
  const [accounts] = useState<SocialAccount[]>(mockAccounts);
  const [showConnect, setShowConnect] = useState(false);

  const grouped = platformConfigs.map((pc) => ({
    ...pc,
    accounts: accounts.filter((a) => a.platform === pc.platform),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Social Accounts</h1>
          <p className="text-sm text-muted-foreground">{accounts.length} accounts connected</p>
        </div>
        <Button onClick={() => setShowConnect(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Connect Account
        </Button>
      </div>

      <div className="space-y-6">
        {grouped.map((group) => (
          <div key={group.platform}>
            <div className="flex items-center gap-2 mb-3">
              <PlatformIcon platform={group.platform} className="h-5 w-5" />
              <h2 className="text-lg font-semibold text-foreground">{platformLabel(group.platform)}</h2>
              <span className="text-sm text-muted-foreground">({group.accounts.length})</span>
            </div>

            {group.accounts.length === 0 ? (
              <div className="card-elevated p-6 text-center">
                <p className="text-sm text-muted-foreground">No {platformLabel(group.platform)} accounts connected</p>
                <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => setShowConnect(true)}>
                  <Plus className="h-3.5 w-3.5" /> Connect
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.accounts.map((account) => {
                  const StatusIcon = statusIcons[account.status];
                  return (
                    <div key={account.id} className="card-elevated p-5 flex items-start gap-4 transition-shadow">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <PlatformIcon platform={account.platform} className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{account.platform_username}</p>
                          <span className={accountStatusChipClass(account.status)}>
                            <StatusIcon className="h-3 w-3" /> {account.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Connected {new Date(account.connected_at).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          {account.status === 'expired' && (
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                              <RefreshCw className="h-3 w-3" /> Reconnect
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" /> Disconnect
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Connect Dialog */}
      <Dialog open={showConnect} onOpenChange={setShowConnect}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Social Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {platformConfigs.map((pc) => (
              <button
                key={pc.platform}
                className="w-full card-elevated p-4 flex items-center gap-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: `${pc.color}20` }}>
                  <PlatformIcon platform={pc.platform} className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{platformLabel(pc.platform)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{pc.description}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnect(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
