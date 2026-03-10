import { Moon, Sun, Bell, Shield, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/stores/app-store';

export default function SettingsPage() {
  const { darkMode, toggleDarkMode } = useAppStore();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="card-elevated p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" /> Profile
        </h2>
        <Separator />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input defaultValue="Demo User" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue="demo@socialflow.app" disabled />
          </div>
        </div>
        <Button size="sm">Save Changes</Button>
      </div>

      {/* Appearance */}
      <div className="card-elevated p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          {darkMode ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
          Appearance
        </h2>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Dark Mode</p>
            <p className="text-xs text-muted-foreground">Toggle between light and dark themes</p>
          </div>
          <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
        </div>
      </div>

      {/* Notifications */}
      <div className="card-elevated p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" /> Notifications
        </h2>
        <Separator />
        {['Post published', 'Post failed', 'Account token expiring', 'Weekly summary'].map((item) => (
          <div key={item} className="flex items-center justify-between">
            <p className="text-sm text-foreground">{item}</p>
            <Switch defaultChecked />
          </div>
        ))}
      </div>

      {/* API */}
      <div className="card-elevated p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" /> API Configuration
        </h2>
        <Separator />
        <div className="space-y-2">
          <Label>API Base URL</Label>
          <Input defaultValue="https://api.socialflow.app" />
          <p className="text-xs text-muted-foreground">The backend API endpoint for all requests</p>
        </div>
        <Button size="sm">Update</Button>
      </div>
    </div>
  );
}
