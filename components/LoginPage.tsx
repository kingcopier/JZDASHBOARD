import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { LogIn, AlertCircle, ArrowLeft, Terminal } from 'lucide-react';
import { Button } from './Button';

interface LoginPageProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const getAuthErrorMessage = (err: any): string => {
  switch (err.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid credentials.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Stand by.';
    case 'auth/network-request-failed':
      return 'Network error. Check connection.';
    case 'auth/popup-closed-by-user':
      return 'Authentication cancelled.';
    case 'auth/popup-blocked':
      return 'Popup blocked. Allow popups and retry.';
    case 'auth/unauthorized-domain':
      return 'Domain not authorised.';
    default:
      return 'Authentication failed.';
  }
};

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[30%] w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Back button */}
      <button
        onClick={onCancel}
        className="absolute top-8 left-8 flex items-center gap-2 font-mono text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft size={14} />
        <span className="tracking-wider uppercase">Back</span>
      </button>

      {/* Card */}
      <div className="relative w-full max-w-sm animate-fade-in-up">

        {/* Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#0a0a0c] border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] mx-auto">
            <Terminal size={24} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="font-orbitron font-black text-xl text-zinc-100 tracking-wider uppercase">
              Authentication
            </h1>
            <p className="font-mono text-[10px] text-zinc-600 tracking-[0.2em] mt-1 uppercase">
              Restricted Access · Verify Identity
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-[#0a0a0c] border border-zinc-800 rounded-2xl p-7 shadow-2xl space-y-5">

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Connecting...' : 'Continue with Google'}
          </button>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
                className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors outline-none font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors outline-none font-mono text-sm"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/30 px-3 py-2.5 rounded-lg border border-red-900/40 font-mono">
                <AlertCircle size={13} className="flex-shrink-0" />
                <span>ERR: {error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              icon={<LogIn size={16} />}
              disabled={loading}
              className="w-full mt-2"
            >
              {loading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM'}
            </Button>
          </form>
        </div>

        <p className="text-center font-mono text-[9px] text-zinc-700 mt-6 tracking-widest uppercase">
          Unauthorized access is monitored and logged.
        </p>
      </div>
    </div>
  );
};
