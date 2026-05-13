import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Input } from './Input';
import { Button } from './Button';
import { LogIn, AlertCircle, Mail } from 'lucide-react';

interface LoginFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const getAuthErrorMessage = (err: any): string => {
  switch (err.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in cancelled.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked. Please allow popups and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorised. Check your Firebase settings.';
    default:
      return 'Authentication failed. Please try again.';
  }
};

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onCancel }) => {
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

  const handleGoogleLogin = async () => {
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
    <div className="space-y-6">
      <div className="space-y-4">
        <Button 
          onClick={handleGoogleLogin} 
          variant="primary" 
          className="w-full bg-white text-black hover:bg-zinc-200"
          icon={<Mail size={16} />}
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Continue with Google'}
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0a0a0c] px-2 text-zinc-500 font-mono">Or continue with email</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/30 p-3 rounded-lg border border-red-900/50">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-6">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            icon={<LogIn size={16} />}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Login'}
          </Button>
        </div>
      </form>
    </div>
  );
};
