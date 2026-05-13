import React from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { Button } from './Button';

interface PendingApprovalProps {
  email: string;
  onLogout: () => void;
}

export const PendingApproval: React.FC<PendingApprovalProps> = ({ email, onLogout }) => {
  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/5 rounded-full blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative max-w-md w-full text-center space-y-8 animate-fade-in-up">

        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#0a0a0c] border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.15)] mx-auto">
          <ShieldAlert size={36} className="text-amber-400" />
        </div>

        {/* Status */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/30 border border-amber-500/30">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-amber-400">
              PENDING AUTHORIZATION
            </span>
          </div>

          <h1 className="font-orbitron font-black text-2xl text-zinc-100 uppercase tracking-wider">
            Access Request<br />Submitted
          </h1>

          <p className="text-zinc-500 text-sm leading-relaxed font-mono">
            Your account <span className="text-zinc-300">{email}</span> is in the queue.<br />
            The administrator will review and grant access shortly.
          </p>
        </div>

        {/* Terminal-style status box */}
        <div className="bg-[#050508] border border-zinc-800 rounded-xl p-5 text-left font-mono text-xs space-y-2">
          <div className="text-zinc-600">$ check_access_status --uid=<span className="text-zinc-400">current</span></div>
          <div className="text-amber-400">⟳ STATUS: AWAITING_ADMIN_REVIEW</div>
          <div className="text-zinc-600">$ eta --estimate</div>
          <div className="text-zinc-500">INFO: No ETA available. Stand by.</div>
          <div className="flex items-center gap-1 text-zinc-700">
            <span>$</span>
            <span className="w-2 h-4 bg-zinc-700 animate-pulse inline-block" />
          </div>
        </div>

        <Button onClick={onLogout} variant="secondary" icon={<LogOut size={16} />}>
          Sign Out
        </Button>
      </div>
    </div>
  );
};
