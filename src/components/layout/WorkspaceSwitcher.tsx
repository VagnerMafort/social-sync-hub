import { ChevronsUpDown, Plus, Check } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/stores/app-store';
import { useWorkspaces } from '@/hooks/use-api';
import { useEffect } from 'react';

export function WorkspaceSwitcher() {
  const { currentWorkspace, setCurrentWorkspace, setWorkspaces, workspaces } = useAppStore();
  const { data: fetchedWorkspaces } = useWorkspaces();

  useEffect(() => {
    if (fetchedWorkspaces && fetchedWorkspaces.length > 0) {
      setWorkspaces(fetchedWorkspaces);
      if (!currentWorkspace) setCurrentWorkspace(fetchedWorkspaces[0]);
    }
  }, [fetchedWorkspaces]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm hover:bg-muted transition-colors text-left">
        <div className="h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--gradient-primary)' }}>
          <span className="text-primary-foreground">{currentWorkspace?.name?.[0] || 'W'}</span>
        </div>
        <span className="truncate flex-1 font-medium">{currentWorkspace?.name || 'Select workspace'}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {workspaces.map((ws) => (
          <DropdownMenuItem key={ws.id} onClick={() => setCurrentWorkspace(ws)} className="gap-2">
            <div className="h-5 w-5 rounded text-[10px] font-bold flex items-center justify-center bg-secondary text-secondary-foreground">{ws.name[0]}</div>
            <span className="truncate">{ws.name}</span>
            {currentWorkspace?.id === ws.id && <Check className="h-4 w-4 ml-auto text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-muted-foreground"><Plus className="h-4 w-4" />Create workspace</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
