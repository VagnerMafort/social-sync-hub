import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus, CalendarDays, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePosts, useAccounts, useMedia, useCreatePost } from '@/hooks/use-api';
import { PlatformIcon, platformLabel } from '@/components/PlatformIcon';
import { postStatusChipClass } from '@/lib/helpers';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Platform } from '@/types';

type ViewMode = 'calendar' | 'list';

export default function SchedulerPage() {
  const { data: posts = [] } = usePosts();
  const { data: accountsList = [] } = useAccounts();
  const { data: mediaList = [] } = useMedia();
  const createPost = useCreatePost();

  const [view, setView] = useState<ViewMode>('calendar');
  const [showDialog, setShowDialog] = useState(false);
  const [newPost, setNewPost] = useState({
    platform: '' as Platform | '',
    account_id: '',
    media_id: '',
    caption: '',
    hashtags: '',
    scheduled_at: '',
  });

  const events = posts.map((p) => ({
    id: p.id,
    title: p.caption.slice(0, 40),
    date: p.scheduled_at.split('T')[0],
    backgroundColor:
      p.platform === 'youtube' ? 'hsl(0 100% 50%)' :
      p.platform === 'instagram' ? 'hsl(326 78% 55%)' : 'hsl(var(--foreground))',
    borderColor: 'transparent',
  }));

  const handleDateClick = (arg: { dateStr: string }) => {
    setNewPost((p) => ({ ...p, scheduled_at: `${arg.dateStr}T12:00` }));
    setShowDialog(true);
  };

  const filteredAccounts = newPost.platform
    ? accountsList.filter((a) => a.platform === newPost.platform && a.status === 'connected')
    : [];

  const handleSchedule = () => {
    if (newPost.platform && newPost.caption) {
      createPost.mutate({
        platform: newPost.platform as Platform,
        account_id: newPost.account_id,
        media_id: newPost.media_id,
        caption: newPost.caption,
        hashtags: newPost.hashtags.split(' ').filter(Boolean),
        scheduled_at: newPost.scheduled_at,
        status: 'scheduled',
      });
    }
    setShowDialog(false);
    setNewPost({ platform: '', account_id: '', media_id: '', caption: '', hashtags: '', scheduled_at: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Scheduler</h1>
          <p className="text-sm text-muted-foreground">Plan and schedule your posts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button onClick={() => setView('calendar')} className={cn('px-3 py-2 text-sm', view === 'calendar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
              <CalendarDays className="h-4 w-4" />
            </button>
            <button onClick={() => setView('list')} className={cn('px-3 py-2 text-sm', view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => setShowDialog(true)} className="gap-2"><Plus className="h-4 w-4" /> New Post</Button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="card-elevated p-4">
          <FullCalendar plugins={[dayGridPlugin, interactionPlugin]} initialView="dayGridMonth" events={events} dateClick={handleDateClick} height="auto" headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek' }} />
        </div>
      ) : (
        <div className="card-elevated divide-y">
          {posts.map((post) => (
            <div key={post.id} className="px-5 py-4 flex items-center gap-4">
              <PlatformIcon platform={post.platform} className="h-5 w-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{post.caption}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(post.scheduled_at), 'MMM d, yyyy h:mm a')}
                  {post.hashtags.length > 0 && <span className="ml-2 text-primary">{post.hashtags.slice(0, 3).join(' ')}</span>}
                </p>
              </div>
              <span className={postStatusChipClass(post.status)}>{post.status}</span>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Schedule New Post</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={newPost.platform} onValueChange={(v) => setNewPost((p) => ({ ...p, platform: v as Platform, account_id: '' }))}>
                  <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                  <SelectContent>
                    {(['youtube', 'instagram', 'tiktok'] as Platform[]).map((pl) => (
                      <SelectItem key={pl} value={pl}><div className="flex items-center gap-2"><PlatformIcon platform={pl} className="h-4 w-4" />{platformLabel(pl)}</div></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Account</Label>
                <Select value={newPost.account_id} onValueChange={(v) => setNewPost((p) => ({ ...p, account_id: v }))} disabled={!newPost.platform}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>{filteredAccounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.platform_username}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Media</Label>
              <Select value={newPost.media_id} onValueChange={(v) => setNewPost((p) => ({ ...p, media_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select media" /></SelectTrigger>
                <SelectContent>{mediaList.filter((m) => m.status === 'ready').map((m) => <SelectItem key={m.id} value={m.id}>{m.filename}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Schedule Date & Time</Label>
              <Input type="datetime-local" value={newPost.scheduled_at} onChange={(e) => setNewPost((p) => ({ ...p, scheduled_at: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Caption</Label>
              <Textarea placeholder="Write your caption…" value={newPost.caption} onChange={(e) => setNewPost((p) => ({ ...p, caption: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Hashtags</Label>
              <Input placeholder="#trending #viral #content" value={newPost.hashtags} onChange={(e) => setNewPost((p) => ({ ...p, hashtags: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSchedule}>Schedule Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
