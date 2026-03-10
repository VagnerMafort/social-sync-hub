import { mockAnalytics } from '@/lib/mock-data';
import { PlatformIcon, platformLabel } from '@/components/PlatformIcon';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['hsl(0, 100%, 50%)', 'hsl(326, 78%, 55%)', 'hsl(0, 0%, 30%)'];

export default function AnalyticsPage() {
  const { platform_breakdown, daily_posts, total_views, total_engagement, engagement_rate } = mockAnalytics;

  const pieData = platform_breakdown.map((p) => ({
    name: platformLabel(p.platform),
    value: p.views,
    platform: p.platform,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Performance metrics across all platforms</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-elevated p-5">
          <p className="text-sm text-muted-foreground">Total Views</p>
          <p className="text-3xl font-bold text-foreground mt-1">{(total_views / 1000).toFixed(1)}K</p>
        </div>
        <div className="card-elevated p-5">
          <p className="text-sm text-muted-foreground">Total Engagement</p>
          <p className="text-3xl font-bold text-foreground mt-1">{(total_engagement / 1000).toFixed(1)}K</p>
        </div>
        <div className="card-elevated p-5">
          <p className="text-sm text-muted-foreground">Engagement Rate</p>
          <p className="text-3xl font-bold text-foreground mt-1">{engagement_rate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Posts Line Chart */}
        <div className="lg:col-span-2 card-elevated p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Daily Activity (30 days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={daily_posts}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => format(new Date(v), 'MMM d')} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card-elevated p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Views by Platform</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {platform_breakdown.map((p, i) => (
              <div key={p.platform} className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full" style={{ background: COLORS[i] }} />
                <PlatformIcon platform={p.platform} className="h-4 w-4" />
                <span className="text-foreground flex-1">{platformLabel(p.platform)}</span>
                <span className="text-muted-foreground">{(p.views / 1000).toFixed(1)}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement by Platform */}
      <div className="card-elevated p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Engagement by Platform</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={platform_breakdown.map((p) => ({ platform: platformLabel(p.platform), engagement: p.engagement, posts: p.posts }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="platform" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="engagement" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
