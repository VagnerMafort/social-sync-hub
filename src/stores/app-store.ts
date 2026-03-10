import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace, User, Notification } from '@/types';

interface AppState {
  user: User | null;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  notifications: Notification[];
  sidebarOpen: boolean;
  darkMode: boolean;

  setUser: (user: User | null) => void;
  setCurrentWorkspace: (ws: Workspace | null) => void;
  setWorkspaces: (ws: Workspace[]) => void;
  setNotifications: (n: Notification[]) => void;
  markNotificationRead: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      currentWorkspace: null,
      workspaces: [],
      notifications: [],
      sidebarOpen: true,
      darkMode: false,

      setUser: (user) => set({ user }),
      setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
      setWorkspaces: (workspaces) => set({ workspaces }),
      setNotifications: (notifications) => set({ notifications }),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleDarkMode: () =>
        set((s) => {
          const newMode = !s.darkMode;
          document.documentElement.classList.toggle('dark', newMode);
          return { darkMode: newMode };
        }),
      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, currentWorkspace: null, workspaces: [] });
      },
    }),
    {
      name: 'socialflow-storage',
      partialize: (state) => ({
        darkMode: state.darkMode,
        sidebarOpen: state.sidebarOpen,
        currentWorkspace: state.currentWorkspace,
      }),
    }
  )
);
