import { ArrowUpRight, ArrowDownRight, TrendingUp, Image, CalendarDays, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAnalytics, usePosts, useAccounts } from '@/hooks/use-api';
import { PlatformIcon, platformLabel } from '@/components/PlatformIcon';
import { postStatusChipClass } from '@/lib/helpers';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { data: analytics } = useAnalytics();
  const { data: posts } = usePosts();
  const { data: accounts } = useAccounts();

  if (!analytics || !posts || !accounts) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;
  }

  const stats = [
    { label: 'Total Posts', value: analytics.total_posts, change: '+12%', up: true, icon: CalendarDays },
    { label: 'This Week', value: analytics.posts_this_week, change: '+3', up: true, icon: TrendingUp },
    { label: 'Total Views', value: `${(analytics.total_views / 1000).toFixed(1)}K`, change: '+8.2%', up: true, icon: Image },
    { label: 'Engagement', value: `${analytics.engagement_rate}%`, change: '-0.3%', up: false, icon: AlertTriangle },
  ];

  const recentPosts = posts.slice(0, 5);
  const chartData = analytics.daily_posts.slice(-14);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your social media performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card-elevated p-5 transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-medium">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${s.up ? 'text-success' : 'text-destructive'}`}>
              {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {s.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-elevated p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Posts Over Time</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => format(new Date(v), 'MMM d')} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-elevated p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">By Platform</h3>
          <div className="space-y-4">
            {analytics.platform_breakdown.map((p) => (
              <div key={p.platform} className="flex items-center gap-3">
                <PlatformIcon platform={p.platform} className="h-5 w-5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{platformLabel(p.platform)}</span>
                    <span className="text-xs text-muted-foreground">{p.posts} posts</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(p.views / analytics.total_views) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t">
            <h4 className="text-xs text-muted-foreground font-medium mb-3">Connected Accounts</h4>
            <div className="space-y-2">
              {accounts.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <PlatformIcon platform={a.platform} className="h-4 w-4" />
                  <span className="text-sm text-foreground truncate flex-1">{a.platform_username}</span>
                  <span className={`h-2 w-2 rounded-full ${a.status === 'connected' ? 'bg-success' : 'bg-destructive'}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card-elevated">
        <div className="px-5 py-4 border-b">
          <h3 className="text-sm font-semibold text-foreground">Recent Posts</h3>
        </div>
        <div className="divide-y">
          {recentPosts.map((post) => (
            <div key={post.id} className="px-5 py-3 flex items-center gap-4">
              <PlatformIcon platform={post.platform} className="h-5 w-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{post.caption}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(post.scheduled_at), 'MMM d, yyyy h:mm a')}</p>
              </div>
              <span className={postStatusChipClass(post.status)}>{post.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
