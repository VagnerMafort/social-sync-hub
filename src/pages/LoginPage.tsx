import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/stores/app-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setWorkspaces, setCurrentWorkspace } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const authFn = isLogin
        ? () => api.auth.login(email, password)
        : () => api.auth.signup(email, password, email.split('@')[0]);
      const result = await authFn();

      if (!result.token && !isLogin) {
        toast.success('Cadastro realizado! Verifique seu email para confirmar.');
        setLoading(false);
        return;
      }

      setUser(result.user);

      try {
        const workspaces = await api.workspaces.list();
        setWorkspaces(workspaces);
        if (workspaces.length > 0) setCurrentWorkspace(workspaces[0]);
      } catch {
        // No workspaces yet — that's ok
        setWorkspaces([]);
      }

      navigate('/');
    } catch (err: any) {
      toast.error(err?.message || 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative overflow-hidden" style={{ background: 'var(--gradient-primary)' }}>
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary-foreground"
              style={{
                width: Math.random() * 200 + 50,
                height: Math.random() * 200 + 50,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.3,
              }}
            />
          ))}
        </div>
        <div className="relative text-center max-w-md">
          <div className="h-16 w-16 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
            <Zap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">SocialFlow</h1>
          <p className="text-primary-foreground/80 text-lg">
            Automate your social media. Schedule to YouTube, Instagram & TikTok from one place.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold gradient-text">SocialFlow</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {isLogin ? 'Sign in to manage your content' : 'Start automating your social media'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
