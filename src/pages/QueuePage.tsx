import { RefreshCw, CheckCircle2, Clock, AlertTriangle, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueue, usePosts, useRetryJob } from '@/hooks/use-api';
import { queueStatusChipClass } from '@/lib/helpers';
import { PlatformIcon } from '@/components/PlatformIcon';
import { format } from 'date-fns';

const statusIcons = {
  pending: Clock,
  processing: RefreshCw,
  completed: CheckCircle2,
  failed: XCircle,
  retrying: AlertTriangle,
};

export default function QueuePage() {
  const { data: jobs = [], refetch } = useQueue();
  const { data: posts = [] } = usePosts();
  const retryJob = useRetryJob();

  const getPost = (postId: string) => posts.find((p) => p.id === postId);

  const stats = {
    pending: jobs.filter((j) => j.status === 'pending').length,
    processing: jobs.filter((j) => j.status === 'processing').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Post Queue</h1>
          <p className="text-sm text-muted-foreground">Monitor publishing jobs</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(stats).map(([key, val]) => (
          <div key={key} className="card-elevated p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{val}</p>
            <p className="text-xs text-muted-foreground capitalize mt-1">{key}</p>
          </div>
        ))}
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Post</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Platform</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Attempts</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Created</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobs.map((job) => {
                const post = getPost(job.post_id);
                const StatusIcon = statusIcons[job.status];
                return (
                  <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3"><p className="text-foreground truncate max-w-[200px]">{post?.caption || job.post_id}</p></td>
                    <td className="px-5 py-3">{post && <PlatformIcon platform={post.platform} className="h-4 w-4" />}</td>
                    <td className="px-5 py-3"><span className={queueStatusChipClass(job.status)}><StatusIcon className="h-3 w-3" /> {job.status}</span></td>
                    <td className="px-5 py-3 text-muted-foreground">{job.attempts}/{job.max_attempts}</td>
                    <td className="px-5 py-3 text-muted-foreground">{format(new Date(job.created_at), 'MMM d, h:mm a')}</td>
                    <td className="px-5 py-3 text-right">
                      {job.status === 'failed' && (
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => retryJob.mutate(job.id)}>
                          <RotateCcw className="h-3 w-3" /> Retry
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
