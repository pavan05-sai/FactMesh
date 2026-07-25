import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { loginUser, registerUser } from '../services/authService';
import { useAppDispatch } from '../hooks/useRedux';
import { setCredentials } from '../store/authSlice';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = isRegister
        ? await registerUser(email, password)
        : await loginUser(email, password);

      dispatch(setCredentials(data));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    const demoEmail = 'demo@factmesh.io';
    const demoPassword = 'password123';
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);

    try {
      const data = await loginUser(demoEmail, demoPassword);
      dispatch(setCredentials(data));
      navigate('/');
    } catch {
      // If demo user doesn't exist yet, register it
      try {
        const regData = await registerUser(demoEmail, demoPassword);
        dispatch(setCredentials(regData));
        navigate('/');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Demo login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="p-3 rounded-2xl bg-accent text-accent-foreground w-fit mx-auto shadow-md">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {isRegister ? 'Create FactMesh Account' : 'Sign in to FactMesh'}
        </h1>
        <p className="text-xs text-muted-foreground">
          Autonomous multi-agent research & fact verification platform
        </p>
      </div>

      <div className="p-8 rounded-2xl border border-border bg-card shadow-lg space-y-6">
        {error && (
          <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs text-rose-400 font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Email address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@factmesh.io"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/50 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/50 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isRegister ? 'Register Account' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-border w-full" />
          <span className="bg-card px-2 text-[10px] font-mono text-muted-foreground uppercase absolute">
            Or
          </span>
        </div>

        <button
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full py-2.5 rounded-xl border border-border bg-muted hover:bg-card text-xs font-semibold text-foreground transition-colors"
        >
          Quick Demo Account Access
        </button>

        <div className="text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};
