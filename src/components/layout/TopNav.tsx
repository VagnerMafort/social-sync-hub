import { Bell, Moon, Sun, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/stores/app-store';
import { mockNotifications } from '@/lib/mock-data';
import { useEffect } from 'react';
import { MobileSidebarTrigger } from './AppSidebar';
import { cn } from '@/lib/utils';

export function TopNav() {
  const { darkMode, toggleDarkMode, notifications, setNotifications } = useAppStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (notifications.length === 0) setNotifications(mockNotifications);
  }, []);

  return (
    <header className="h-14 border-b bg-card flex items-center px-4 gap-3 shrink-0">
      <MobileSidebarTrigger />

      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search posts, media, accounts…"
            className="w-full h-9 rounded-lg border bg-background pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={toggleDarkMode} className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                {unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <div className="px-3 py-2 border-b">
              <p className="text-sm font-semibold">Notifications</p>
            </div>
            {notifications.slice(0, 5).map((n) => (
              <DropdownMenuItem key={n.id} className="flex-col items-start gap-1 py-3">
                <div className="flex items-center gap-2 w-full">
                  <span className={cn(
                    'h-2 w-2 rounded-full shrink-0',
                    n.type === 'success' && 'bg-success',
                    n.type === 'error' && 'bg-destructive',
                    n.type === 'warning' && 'bg-warning',
                    n.type === 'info' && 'bg-info',
                  )} />
                  <span className="text-sm font-medium">{n.title}</span>
                  {!n.read && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                </div>
                <p className="text-xs text-muted-foreground pl-4">{n.message}</p>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold ml-1">
          U
        </div>
      </div>
    </header>
  );
}
