import React, { useState, useEffect } from 'react';
import { Bitcoin } from 'lucide-react';

interface LandingPageProps {
  onEnterVault: () => void;
  onLoginClick: () => void;
}

// The secret sigil — a tiny, barely-visible glyph hidden in the grid
// No hover cursor change, no tooltip, no indication it's clickable
const SecretSigil: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    setTimeout(onClick, 800);
  };

  return (
    <div
      onClick={handleClick}
      style={{ cursor: 'default' }}
      className="absolute bottom-16 right-16 select-none"
      aria-hidden="true"
    >
      {/* Decorative grid noise that happens to be clickable */}
      <div className={`transition-all duration-700 ${clicked ? 'opacity-100 scale-150' : 'opacity-[0.06]'}`}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="1" width="4" height="4" fill="#06b6d4"/>
          <rect x="7" y="1" width="4" height="4" fill="#06b6d4"/>
          <rect x="13" y="1" width="4" height="4" fill="#06b6d4"/>
          <rect x="1" y="7" width="4" height="4" fill="#06b6d4"/>
          <rect x="7" y="7" width="4" height="4" fill="#a78bfa"/>
          <rect x="13" y="7" width="4" height="4" fill="#06b6d4"/>
          <rect x="1" y="13" width="4" height="4" fill="#06b6d4"/>
          <rect x="7" y="13" width="4" height="4" fill="#06b6d4"/>
          <rect x="13" y="13" width="4" height="4" fill="#06b6d4"/>
        </svg>
      </div>
      {clicked && (
        <div className="absolute inset-0 -inset-x-8 -inset-y-4 flex items-center justify-center">
          <span className="font-mono text-[8px] text-cyan-400 animate-pulse tracking-widest whitespace-nowrap">
            DECRYPTING...
          </span>
        </div>
      )}
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterVault, onLoginClick }) => {
  const [glitchActive, setGlitchActive] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);

  const terminalLines = [
    '> INITIALIZING NEURAL INTERFACE...',
    '> CONNECTING TO JARED_ZANDER.db...',
    '> ACCESS GRANTED. LOADING MANIFEST...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setLineIndex(i => {
        if (i >= terminalLines.length - 1) {
          clearInterval(timer);
          return i;
        }
        return i + 1;
      });
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const glitch = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150);
    }, 4000);
    return () => clearInterval(glitch);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#020202] text-zinc-100 overflow-hidden flex flex-col items-center justify-center">

      {/* Background atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[10%] w-[700px] h-[700px] bg-cyan-500/8 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[5%] w-[800px] h-[800px] bg-purple-600/8 rounded-full blur-[160px]" />
        <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[120px]" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* BTC Admin button — top right, subtle */}
      <button
        onClick={onLoginClick}
        aria-label="Admin login"
        style={{ cursor: 'default' }}
        className="fixed top-8 right-8 text-zinc-800 hover:text-zinc-600 transition-colors duration-300 z-50"
      >
        <Bitcoin size={18} />
      </button>

      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-10">

        {/* Status pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a0a0c]/80 border border-cyan-500/20 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-cyan-400/80">
            SYSTEM ONLINE — OPERATOR: JARED ZANDER
          </span>
        </div>

        {/* Hero heading */}
        <div className="space-y-2">
          <h1
            className={`font-orbitron font-black uppercase leading-none tracking-tighter transition-all duration-150 ${glitchActive ? 'translate-x-[2px] opacity-90' : ''}`}
            style={{ fontSize: 'clamp(3.5rem, 10vw, 9rem)' }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400">
              JARED
            </span>
            <br />
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400"
              style={{ textShadow: 'none', filter: 'drop-shadow(0 0 40px rgba(6,182,212,0.4))' }}
            >
              ZANDER
            </span>
          </h1>
          <p className="font-mono text-sm text-zinc-600 tracking-[0.3em] uppercase">
            — Digital Architect —
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 justify-center">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-cyan-500/40" />
          <div className="w-1 h-1 rounded-full bg-cyan-500/40" />
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-cyan-500/40" />
        </div>

        {/* Hype copy */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <p className="text-xl text-zinc-300 font-light leading-relaxed">
            Most portfolios show you what someone did.<br />
            <span className="text-white font-medium">This one shows you what's possible.</span>
          </p>
          <p className="text-zinc-500 text-base leading-relaxed">
            A curated vault of projects that push interfaces, automate the unautomatable,
            and ship things that shouldn't exist yet. Code that actually works.
            Designs that make people stop scrolling. Systems built to last.
          </p>
        </div>

        {/* Stats row */}
        <div className="flex justify-center gap-12 pt-2">
          {[
            { label: 'PROJECTS', value: 'CLASSIFIED' },
            { label: 'STACK', value: '∞' },
            { label: 'EXCUSES', value: '0' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="font-orbitron font-black text-2xl text-white tracking-wider">{value}</div>
              <div className="font-mono text-[9px] tracking-[0.2em] text-zinc-600 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Terminal animation */}
        <div className="max-w-md mx-auto bg-[#050508] border border-zinc-800 rounded-xl p-5 text-left font-mono text-xs">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-800">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            <span className="text-zinc-600 text-[10px] ml-2">zander@project-db ~ %</span>
          </div>
          <div className="space-y-1.5">
            {terminalLines.slice(0, lineIndex + 1).map((line, i) => (
              <div
                key={i}
                className={`${i === lineIndex ? 'text-cyan-400' : 'text-zinc-600'} flex items-center gap-1`}
              >
                <span>{line}</span>
                {i === lineIndex && i < terminalLines.length - 1 && (
                  <span className="w-2 h-3.5 bg-cyan-400 animate-pulse inline-block ml-0.5" />
                )}
              </div>
            ))}
            {lineIndex === terminalLines.length - 1 && (
              <div className="text-green-400 mt-2 pt-2 border-t border-zinc-800/50">
                ✓ VAULT ONLINE. EXPLORE AT YOUR OWN RISK.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Secret sigil — bottom right, barely visible, part of the "grid noise" */}
      <SecretSigil onClick={onEnterVault} />

      {/* Footer */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[9px] text-zinc-800 tracking-[0.3em] uppercase">
        © {new Date().getFullYear()} JARED ZANDER — ALL RIGHTS RESERVED
      </div>
    </div>
  );
};
