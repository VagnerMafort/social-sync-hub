import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Image, CalendarDays, Users, ListChecks, BarChart3, Settings,
  ChevronLeft, Zap, Menu,
} from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Media Library', path: '/media', icon: Image },
  { label: 'Scheduler', path: '/scheduler', icon: CalendarDays },
  { label: 'Accounts', path: '/accounts', icon: Users },
  { label: 'Queue', path: '/queue', icon: ListChecks },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 72 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 top-0 bottom-0 z-50 bg-card border-r flex flex-col',
          'lg:relative',
          !sidebarOpen && 'max-lg:-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-16 border-b shrink-0">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--gradient-primary)' }}>
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-lg whitespace-nowrap overflow-hidden gradient-text"
              >
                SocialFlow
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={toggleSidebar}
            className="ml-auto p-1.5 rounded-md hover:bg-muted text-muted-foreground hidden lg:flex"
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')} />
          </button>
        </div>

        {/* Workspace Switcher */}
        {sidebarOpen && (
          <div className="px-3 py-3 border-b">
            <WorkspaceSwitcher />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>
      </motion.aside>
    </>
  );
}

export function MobileSidebarTrigger() {
  const { toggleSidebar } = useAppStore();
  return (
    <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-md hover:bg-muted text-muted-foreground">
      <Menu className="h-5 w-5" />
    </button>
  );
}
