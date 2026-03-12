import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { TopNav } from './TopNav';
import { mySupabase } from '@/lib/supabase-client';
import { useAppStore } from '@/stores/app-store';

export function AppLayout() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const setUser = useAppStore((s) => s.setUser);

  useEffect(() => {
    const { data: { subscription } } = mySupabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthenticated(true);
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          full_name: session.user.user_metadata?.full_name ?? '',
          avatar_url: session.user.user_metadata?.avatar_url,
        });
      } else {
        setAuthenticated(false);
        setUser(null);
      }
      setLoading(false);
    });

    mySupabase.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
