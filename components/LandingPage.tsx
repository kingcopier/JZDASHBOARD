import React, { useEffect, useRef, useState } from 'react';
import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';
import { addDoc, collection, doc, onSnapshot } from 'firebase/firestore';
import {
  ArrowRight,
  Bitcoin,
  Boxes,
  ChevronDown,
  Cpu,
  KeyRound,
  LockKeyhole,
  Mail,
  Orbit,
  ScanSearch,
  Shield,
  ShieldAlert,
  Sparkles,
  Terminal,
  User,
  X,
} from 'lucide-react';
import { db } from '../firebase';
import { VaultSettings } from '../types';

interface LandingPageProps {
  onEnterVault: () => void;
  onLoginClick: () => void;
}

const terminalLines = [
  '> INITIALIZING CREATIVE COMMAND SURFACE...',
  '> SYNCING PROJECT ARCHIVE / SIGNALS / PROTOTYPES...',
  '> ACCESS CHANNEL OPEN. STEP INSIDE THE VAULT.',
];

const DEFAULT_VAULT_PHRASE = 'show me';
const DEFAULT_TERMINAL_TITLE = 'Access Console';
const DEFAULT_DENIAL_COPY = 'Unauthorized but interesting. Request channel opened.';
const DEFAULT_REQUEST_TITLE = 'Private access request';
const DEFAULT_REQUEST_COPY = 'Leave a clean signal. If the public key changes, this is the request list Jared checks first.';
const DEFAULT_INTENSITY: NonNullable<VaultSettings['intensity']> = 'subtle';
const DEFAULT_EASTER_EGG_PHRASE = 'quiet room';
const DEFAULT_EASTER_EGG_MESSAGE = 'Hidden signal found. No access granted, just a private nod from the interface.';
const DEFAULT_EASTER_EGG_VISUAL: NonNullable<VaultSettings['easterEggVisual']> = 'amber';
const VAULT_COLD_OPEN_MS = 850;
const VAULT_BOOT_MS = 1450;
const VAULT_UNLOCK_MS = 1200;
const VAULT_DENIED_MS = 2300;

type VaultPhase = 'closed' | 'coldOpen' | 'booting' | 'input' | 'unlocking' | 'denied';

const terminalBootLines = [
  'identity: jared zander / private index',
  'route: public archive / encrypted standby',
  'operator phrase: required',
];

const deniedLogs = [
  'phrase rejected by vault policy',
  'public archive route remains sealed',
  'private request channel prepared',
];

const unlockLogs = [
  'phrase accepted',
  'key resolved',
  'public route opening',
];

const manifestItems = [
  {
    title: 'Visual Systems',
    copy: 'Interfaces with enough tension, contrast, and pacing to feel authored instead of assembled.',
    icon: Sparkles,
  },
  {
    title: 'Launch Systems',
    copy: 'Tools, automations, and product surfaces built to ship fast and hold up after the novelty wears off.',
    icon: Boxes,
  },
  {
    title: 'Signal Control',
    copy: 'Narrative, positioning, and interactive motion designed to make the work feel inevitable.',
    icon: Orbit,
  },
];

const SecretSigil: React.FC<{ onClick: () => void; onSecret: () => void }> = ({ onClick, onSecret }) => {
  const [clicked, setClicked] = useState(false);
  const clickTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        window.clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = window.setTimeout(() => {
      setClicked(true);
      onClick();
      clickTimerRef.current = null;
    }, 220);
  };

  const handleDoubleClick = () => {
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    setClicked(true);
    onSecret();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      aria-label="Enter the vault"
      className="group absolute bottom-8 right-8 z-20 rounded-full border border-sky-400/10 bg-slate-950/50 p-3 text-sky-300/50 transition-all duration-300 hover:border-sky-400/30 hover:bg-slate-900/80 hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 motion-reduce:transition-none"
    >
      <div className={`transition-transform duration-300 ${clicked ? 'scale-125' : 'group-hover:scale-110'}`}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="1" width="4" height="4" fill="#7dd3fc" />
          <rect x="7" y="1" width="4" height="4" fill="#7dd3fc" />
          <rect x="13" y="1" width="4" height="4" fill="#7dd3fc" />
          <rect x="1" y="7" width="4" height="4" fill="#7dd3fc" />
          <rect x="7" y="7" width="4" height="4" fill="#fb923c" />
          <rect x="13" y="7" width="4" height="4" fill="#7dd3fc" />
          <rect x="1" y="13" width="4" height="4" fill="#7dd3fc" />
          <rect x="7" y="13" width="4" height="4" fill="#7dd3fc" />
          <rect x="13" y="13" width="4" height="4" fill="#7dd3fc" />
        </svg>
      </div>
    </button>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterVault, onLoginClick }) => {
  const [glitchActive, setGlitchActive] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [vaultPhase, setVaultPhase] = useState<VaultPhase>('closed');
  const [terminalValue, setTerminalValue] = useState('');
  const [accessPopupOpen, setAccessPopupOpen] = useState(false);
  const [accessName, setAccessName] = useState('');
  const [accessEmail, setAccessEmail] = useState('');
  const [accessSubmitting, setAccessSubmitting] = useState(false);
  const [accessSubmitted, setAccessSubmitted] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [vaultSettings, setVaultSettings] = useState<Required<Omit<VaultSettings, 'updatedAt'>>>({
    phrase: DEFAULT_VAULT_PHRASE,
    terminalTitle: DEFAULT_TERMINAL_TITLE,
    denialCopy: DEFAULT_DENIAL_COPY,
    requestTitle: DEFAULT_REQUEST_TITLE,
    requestCopy: DEFAULT_REQUEST_COPY,
    intensity: DEFAULT_INTENSITY,
    soundEnabled: true,
    easterEggPhrase: DEFAULT_EASTER_EGG_PHRASE,
    easterEggMessage: DEFAULT_EASTER_EGG_MESSAGE,
    easterEggVisual: DEFAULT_EASTER_EGG_VISUAL,
  });
  const [soundMuted, setSoundMuted] = useState(false);
  const [easterEggOpen, setEasterEggOpen] = useState(false);
  const terminalInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLineIndex((current) => {
        if (current >= terminalLines.length - 1) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 1100);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const glitchTimer = window.setInterval(() => {
      setGlitchActive(true);
      window.setTimeout(() => setGlitchActive(false), 140);
    }, 4200);

    return () => window.clearInterval(glitchTimer);
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'appSettings', 'vault'), (snapshot) => {
      const data = snapshot.data() as VaultSettings | undefined;
      setVaultSettings({
        phrase: data?.phrase || DEFAULT_VAULT_PHRASE,
        terminalTitle: data?.terminalTitle || DEFAULT_TERMINAL_TITLE,
        denialCopy: data?.denialCopy || DEFAULT_DENIAL_COPY,
        requestTitle: data?.requestTitle || DEFAULT_REQUEST_TITLE,
        requestCopy: data?.requestCopy || DEFAULT_REQUEST_COPY,
        intensity: data?.intensity || DEFAULT_INTENSITY,
        soundEnabled: data?.soundEnabled ?? true,
        easterEggPhrase: data?.easterEggPhrase || DEFAULT_EASTER_EGG_PHRASE,
        easterEggMessage: data?.easterEggMessage || DEFAULT_EASTER_EGG_MESSAGE,
        easterEggVisual: data?.easterEggVisual || DEFAULT_EASTER_EGG_VISUAL,
      });
    }, () => {
      setVaultSettings((current) => ({ ...current, phrase: DEFAULT_VAULT_PHRASE }));
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (vaultPhase !== 'coldOpen') return undefined;
    const timer = window.setTimeout(() => setVaultPhase('booting'), VAULT_COLD_OPEN_MS);
    return () => window.clearTimeout(timer);
  }, [vaultPhase]);

  useEffect(() => {
    if (vaultPhase !== 'booting') return undefined;
    const timer = window.setTimeout(() => setVaultPhase('input'), VAULT_BOOT_MS);
    return () => window.clearTimeout(timer);
  }, [vaultPhase]);

  useEffect(() => {
    if (vaultPhase !== 'input') return undefined;
    const timer = window.setTimeout(() => terminalInputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [vaultPhase]);

  useEffect(() => {
    if (vaultPhase !== 'unlocking') return undefined;
    const timer = window.setTimeout(() => {
      setVaultPhase('closed');
      setTerminalValue('');
      onEnterVault();
    }, VAULT_UNLOCK_MS);

    return () => window.clearTimeout(timer);
  }, [onEnterVault, vaultPhase]);

  useEffect(() => {
    if (vaultPhase !== 'denied') return undefined;
    const timer = window.setTimeout(() => {
      setVaultPhase('closed');
      setTerminalValue('');
      setAccessPopupOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, VAULT_DENIED_MS);

    return () => window.clearTimeout(timer);
  }, [vaultPhase]);

  const openVaultTerminal = () => {
    if (vaultPhase !== 'closed') return;
    setTerminalValue('');
    playVaultTone('open');
    logVaultEvent('opened');
    setVaultPhase('coldOpen');
  };

  const logVaultEvent = async (type: 'opened' | 'success' | 'denied' | 'easter') => {
    try {
      await addDoc(collection(db, 'vaultAnalytics'), {
        type,
        createdAt: Date.now(),
        source: 'vault',
        intensity: vaultSettings.intensity,
      });
    } catch {
      // Analytics must never block the vault experience.
    }
  };

  const playVaultTone = (kind: 'open' | 'denied' | 'unlock' | 'tick') => {
    if (!vaultSettings.soundEnabled || soundMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const gain = audioContext.createGain();
      const profile = {
        open: { frequencies: [164, 246], volume: 0.035, duration: 0.32 },
        denied: { frequencies: [92, 61, 37], volume: 0.08, duration: 0.42 },
        unlock: { frequencies: [220, 330, 440], volume: 0.045, duration: 0.58 },
        tick: { frequencies: [880], volume: 0.012, duration: 0.045 },
      }[kind];
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(profile.volume, audioContext.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + profile.duration);
      gain.connect(audioContext.destination);

      profile.frequencies.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        oscillator.type = kind === 'denied' ? (index === 0 ? 'sawtooth' : 'square') : 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + index * 0.06);
        oscillator.connect(gain);
        oscillator.start(audioContext.currentTime + index * 0.06);
        oscillator.stop(audioContext.currentTime + profile.duration);
      });

      window.setTimeout(() => audioContext.close().catch(() => undefined), (profile.duration + 0.24) * 1000);
    } catch {
      // Browsers can block audio; the visual sequence still carries the state.
    }
  };

  const submitTerminal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (vaultPhase !== 'input') return;

    if (terminalValue === vaultSettings.phrase) {
      playVaultTone('unlock');
      logVaultEvent('success');
      setVaultPhase('unlocking');
      return;
    }

    if (terminalValue === vaultSettings.easterEggPhrase) {
      logVaultEvent('easter');
      setEasterEggOpen(true);
      setVaultPhase('closed');
      setTerminalValue('');
      return;
    }

    playVaultTone('denied');
    logVaultEvent('denied');
    setVaultPhase('denied');
  };

  const closeAccessPopup = () => {
    setAccessPopupOpen(false);
    setAccessName('');
    setAccessEmail('');
    setAccessSubmitting(false);
    setAccessSubmitted(false);
    setAccessError('');
  };

  const submitAccessRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = accessName.trim();
    const email = accessEmail.trim().toLowerCase();
    if (!name || !email) return;

    setAccessSubmitting(true);
    setAccessError('');
    try {
      await addDoc(collection(db, 'accessRequests'), {
        name,
        email,
        createdAt: Date.now(),
        source: 'vault-denied',
      });
      setAccessSubmitted(true);
    } catch {
      setAccessError('REQUEST FAILED. TRY AGAIN LATER.');
    } finally {
      setAccessSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-4 text-[var(--text-strong)] sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[6%] h-72 w-72 rounded-full bg-sky-400/12 blur-[120px]" />
        <div className="absolute bottom-[8%] right-[6%] h-80 w-80 rounded-full bg-orange-400/10 blur-[140px]" />
        <div className="absolute right-[22%] top-[30%] h-56 w-56 rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col">
        <header className="panel-surface hero-sheen flex items-center rounded-[1.75rem] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="signal-dot bg-emerald-400" />
            <div>
              <p className="hairline-label">Creative Vault Online</p>
              <p className="text-sm text-slate-300">Jared Zander / interface systems / experimental builds</p>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-8 py-8 lg:py-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-slate-950/50 px-4 py-2">
              <ScanSearch size={14} className="text-sky-300" />
              <span className="hairline-label">Editorial Portfolio / Live Archive / High-Signal Work</span>
            </div>

            <div className="space-y-6">
              <h1
                className={`section-title text-balance text-[clamp(4rem,12vw,8.8rem)] leading-[0.88] ${glitchActive ? 'translate-x-[2px] opacity-95' : ''} transition-all duration-150 motion-reduce:transition-none`}
              >
                More Than A<br />
                <span className="bg-gradient-to-r from-sky-200 via-sky-400 to-orange-300 bg-clip-text text-transparent">
                  Portfolio
                </span>
              </h1>

              <div className="max-w-2xl space-y-4 text-balance">
                <p className="text-2xl font-medium tracking-tight text-slate-100 sm:text-3xl">
                  A cinematic launch surface for code, design systems, automations, and ideas worth stealing carefully.
                </p>
                <p className="max-w-xl text-base leading-8 text-[var(--text-soft)] sm:text-lg">
                  This isn&apos;t a sterile gallery. It&apos;s a live command deck for projects that ship with attitude, clear systems, and enough visual voltage to earn attention.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                data-vault-trigger="true"
                type="button"
                onClick={openVaultTerminal}
                disabled={vaultPhase !== 'closed'}
                className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-2xl bg-sky-300 px-6 py-4 font-orbitron text-sm font-bold uppercase tracking-[0.24em] text-slate-950 transition-all duration-200 hover:bg-sky-200 hover:shadow-[0_0_45px_rgba(125,211,252,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-100 disabled:cursor-wait disabled:opacity-80 motion-reduce:transition-none"
              >
                {vaultPhase !== 'closed' ? 'Vault Opening' : 'Enter The Vault'}
                <ArrowRight size={18} />
              </button>

              <a
                href="#manifest"
                className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-orbitron text-sm font-bold uppercase tracking-[0.24em] text-slate-100 transition-all duration-200 hover:border-orange-300/40 hover:bg-orange-300/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 motion-reduce:transition-none"
              >
                See The System
                <ChevronDown size={18} />
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="panel-surface rounded-[1.5rem] p-5">
                <p className="hairline-label">Operating Mode</p>
                <p className="mt-4 text-2xl font-bold tracking-tight text-white">Signal over noise</p>
              </div>
              <div className="panel-surface rounded-[1.5rem] p-5">
                <p className="hairline-label">Medium</p>
                <p className="mt-4 text-2xl font-bold tracking-tight text-white">Code / motion / systems</p>
              </div>
              <div className="panel-surface rounded-[1.5rem] p-5">
                <p className="hairline-label">Expectation</p>
                <p className="mt-4 text-2xl font-bold tracking-tight text-white">No average screens</p>
              </div>
            </div>
          </section>

          <section className="relative min-h-[560px] overflow-visible lg:min-h-[720px]">
            <div style={{ mixBlendMode: 'screen', position: 'absolute', top: -160, bottom: 0, left: '-25%', right: '-50%' }}>
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="h-full w-full"
              />
            </div>
          </section>
          </div>

          <section className="space-y-5">
            <div className="panel-surface-strong float-drift rounded-[2rem] p-6 motion-reduce:transform-none">
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="hairline-label">Live System Feed</p>
                  <p className="mt-2 text-sm text-slate-400">A front row seat to prototypes, launches, and interface experiments.</p>
                </div>
                <Shield size={18} className="text-sky-300" />
              </div>

              <div className="space-y-3 rounded-[1.5rem] border border-white/8 bg-slate-950/70 p-5 font-mono text-xs text-slate-300">
                <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  <span className="h-2 w-2 rounded-full bg-amber-300" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="ml-2">zander@creative-vault ~ stream</span>
                </div>
                {terminalLines.slice(0, lineIndex + 1).map((line, index) => (
                  <div key={line} className={`${index === lineIndex ? 'text-sky-300' : 'text-slate-500'} flex items-center gap-2`}>
                    <span>{line}</span>
                    {index === lineIndex && index < terminalLines.length - 1 && (
                      <span className="h-3.5 w-2 animate-pulse bg-sky-300 motion-reduce:animate-none" />
                    )}
                  </div>
                ))}
                {lineIndex === terminalLines.length - 1 && (
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-emerald-300">
                    READY: vault door unsealed, public archive standing by.
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className="hairline-label">Energy</p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-white">A+</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className="hairline-label">Output</p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-white">Multi-stack</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className="hairline-label">Delivery</p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-white">Built to ship</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="panel-surface rounded-[1.5rem] p-5">
                <p className="hairline-label">Proof Stack</p>
                <p className="mt-3 text-lg font-semibold text-white">Interfaces that hold attention without turning into gimmicks.</p>
              </div>
              <div className="panel-surface rounded-[1.5rem] p-5">
                <p className="hairline-label">Build Bias</p>
                <p className="mt-3 text-lg font-semibold text-white">Fast iteration, hard edges, strong typography, intentional motion.</p>
              </div>
            </div>
          </section>
        </main>

        <section id="manifest" className="grid gap-5 pb-8 lg:grid-cols-3">
          {manifestItems.map(({ title, copy, icon: Icon }) => (
            <article key={title} className="panel-surface rounded-[1.75rem] p-6">
              <div className="mb-6 inline-flex rounded-2xl border border-sky-300/20 bg-sky-300/10 p-3 text-sky-200">
                <Icon size={20} />
              </div>
              <h2 className="font-orbitron text-2xl font-bold uppercase tracking-tight text-white">{title}</h2>
              <p className="mt-4 leading-7 text-[var(--text-soft)]">{copy}</p>
            </article>
          ))}
        </section>

        <footer className="relative flex flex-col items-center gap-3 border-t border-white/8 py-6 text-center">
          <button
            type="button"
            onClick={onLoginClick}
            aria-label="Admin login"
            title="Admin login"
            className="absolute left-0 top-6 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-slate-600 transition-all duration-200 hover:border-sky-300/30 hover:bg-sky-300/10 hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 motion-reduce:transition-none"
          >
            <Bitcoin size={17} />
          </button>
          <p className="hairline-label pulse-line">System note: built to feel intentional, not templated</p>
          <p className="text-xs uppercase tracking-[0.26em] text-slate-600">© {new Date().getFullYear()} Jared Zander / all rights reserved</p>
        </footer>
      </div>

      <div data-vault-trigger="true">
        <SecretSigil
          onClick={onEnterVault}
          onSecret={() => {
            logVaultEvent('easter');
            setEasterEggOpen(true);
          }}
        />
      </div>

      {vaultPhase === 'coldOpen' && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black text-white">
          <div className="vault-cold-open pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(125,211,252,0.14),transparent_34%),linear-gradient(180deg,rgba(2,6,23,0.22),rgba(0,0,0,0.94))]" />
          <div className="relative flex h-full items-center justify-center px-6 text-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.46em] text-sky-200">entering private layer</p>
              <h2 className="mt-5 font-orbitron text-[clamp(3rem,10vw,7rem)] font-black uppercase leading-none tracking-[-0.06em] text-white">
                Vault
              </h2>
            </div>
          </div>
        </div>
      )}

      {vaultPhase !== 'closed' && vaultPhase !== 'denied' && vaultPhase !== 'coldOpen' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#010307] px-3 py-4 animate-fade-in-up sm:px-6"
          role="dialog"
          aria-modal="true"
          aria-label="Vault terminal"
        >
          <div className="vault-grid pointer-events-none absolute inset-0 opacity-35" />
          <div className="precision-scanline pointer-events-none absolute inset-0 opacity-45" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(125,211,252,0.16),transparent_38%),radial-gradient(circle_at_82%_82%,rgba(251,191,36,0.08),transparent_34%),linear-gradient(180deg,rgba(3,7,18,0.18),rgba(0,0,0,0.92))]" />

          <div className={`luxury-vault-shell vault-intensity-${vaultSettings.intensity} relative w-full max-w-5xl overflow-hidden border border-sky-200/15 bg-[#03060c]/95 shadow-[0_48px_180px_rgba(0,0,0,0.92),0_0_90px_rgba(125,211,252,0.10)] ${vaultPhase === 'unlocking' ? 'unlock-glow' : ''}`}>
            <div className="luxury-sweep pointer-events-none absolute inset-0" />
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.025] px-5 py-4 font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
              <span className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${vaultPhase === 'unlocking' ? 'bg-emerald-300' : 'bg-sky-300'} shadow-[0_0_18px_currentColor]`} />
                private intelligence interface
              </span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSoundMuted((current) => !current)}
                  className="cursor-pointer text-slate-600 transition-colors hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 motion-reduce:transition-none"
                >
                  {soundMuted || !vaultSettings.soundEnabled ? 'sound off' : 'sound on'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVaultPhase('closed');
                    setTerminalValue('');
                  }}
                  disabled={vaultPhase === 'unlocking'}
                  className="cursor-pointer text-slate-600 transition-colors hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-wait disabled:opacity-40 motion-reduce:transition-none"
                >
                  close
                </button>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[0.72fr_1.28fr]">
              <aside className="border-b border-white/10 bg-white/[0.018] p-5 lg:border-b-0 lg:border-r">
                <div className="mb-8 flex items-center gap-3 text-sky-200">
                  <LockKeyhole size={17} />
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em]">Vault Protocol</p>
                </div>
                <div className="space-y-4">
                  {[
                    ['identity', 'verified surface'],
                    ['route', vaultPhase === 'unlocking' ? 'opening' : 'sealed'],
                    ['operator', vaultPhase === 'input' ? 'awaiting phrase' : vaultPhase],
                  ].map(([label, value]) => (
                    <div key={label} className="border border-white/8 bg-black/25 p-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-slate-600">{label}</p>
                      <p className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-slate-300">{value}</p>
                    </div>
                  ))}
                </div>
              </aside>

              <section className="p-5 sm:p-8">
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-sky-300">Jared Zander / private index</p>
                    <h2 className="mt-3 font-orbitron text-3xl font-black uppercase tracking-[-0.03em] text-white sm:text-5xl">
                      {vaultSettings.terminalTitle}
                    </h2>
                  </div>
                  <div className="rounded-full border border-amber-200/15 bg-amber-200/5 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-amber-100">
                    No hint loaded
                  </div>
                </div>

                <div className="relative min-h-[390px] overflow-hidden border border-white/10 bg-black/55 p-5 font-mono text-slate-400 shadow-[inset_0_0_80px_rgba(125,211,252,0.055)] sm:p-7">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent" />

                  <div className="space-y-4 text-xs uppercase tracking-[0.18em]">
                    {terminalBootLines.map((line, index) => {
                      const isVisible = vaultPhase !== 'booting' || index === 0 || (index === 1 && vaultPhase === 'booting');
                      return (
                        <div key={line} className={`flex items-center gap-3 ${isVisible ? 'encrypted-shimmer text-slate-300' : 'text-slate-700'}`}>
                          <span className="text-sky-400/70">0{index + 1}</span>
                          <span>{line}</span>
                        </div>
                      );
                    })}
                  </div>

                  {vaultPhase === 'booting' && (
                    <div className="mt-12 border border-sky-200/10 bg-sky-200/[0.025] p-5">
                      <div className="mb-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.26em] text-slate-500">
                        <span>silent boot sweep</span>
                        <span>calibrating</span>
                      </div>
                      <div className="h-px overflow-hidden bg-white/10">
                        <div className="luxury-progress h-full bg-gradient-to-r from-transparent via-sky-200 to-transparent" />
                      </div>
                    </div>
                  )}

                  {vaultPhase === 'input' && (
                    <form onSubmit={submitTerminal} className="mt-12">
                      <label className="block border border-sky-200/15 bg-sky-200/[0.035] p-4 sm:p-5">
                        <span className="mb-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.24em] text-sky-200">
                          <Terminal size={16} />
                          exact operator phrase required
                        </span>
                        <span className="flex items-center gap-3 text-lg text-slate-100 sm:text-2xl">
                          <span className="shrink-0 text-sky-300">vault:~$</span>
                          <input
                            ref={terminalInputRef}
                            value={terminalValue}
                            onChange={(event) => {
                              setTerminalValue(event.target.value);
                              playVaultTone('tick');
                            }}
                            spellCheck={false}
                            autoComplete="off"
                            autoCapitalize="none"
                            autoCorrect="off"
                            aria-label="Vault terminal command"
                            className="min-w-0 flex-1 bg-transparent font-mono text-slate-100 outline-none caret-sky-200"
                          />
                          <span className="soft-terminal-cursor h-7 w-2 bg-sky-200" aria-hidden="true" />
                        </span>
                      </label>
                      <button type="submit" className="sr-only">
                        Submit terminal command
                      </button>
                    </form>
                  )}

                  {vaultPhase === 'unlocking' && (
                    <div className="mt-12 border border-emerald-200/20 bg-emerald-200/[0.045] p-5">
                      <div className="mb-6 flex items-center gap-3 text-emerald-200">
                        <KeyRound size={17} />
                        <p className="font-mono text-[10px] uppercase tracking-[0.3em]">Unlock sequence accepted</p>
                      </div>
                      <div className="space-y-3 text-xs uppercase tracking-[0.18em] text-emerald-100/80">
                        {unlockLogs.map((log, index) => (
                          <div key={log} className="flex gap-3">
                            <span className="text-emerald-300">0{index + 1}</span>
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {vaultPhase === 'denied' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-[#080102] px-4 text-white">
          <div className="precision-scanline pointer-events-none absolute inset-0 opacity-35" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(248,113,113,0.12),transparent_40%),linear-gradient(180deg,rgba(127,29,29,0.16),rgba(0,0,0,0.9))]" />

          <div className="relative w-full max-w-4xl border border-red-200/18 bg-black/72 p-5 shadow-[0_40px_150px_rgba(0,0,0,0.9),0_0_70px_rgba(248,113,113,0.10)] sm:p-8">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-red-200/15 pb-5 font-mono text-[10px] uppercase tracking-[0.3em]">
              <span className="flex items-center gap-3 text-red-200">
                <ShieldAlert size={15} />
                controlled lockout
              </span>
              <span className="text-slate-600">request handoff queued</span>
            </div>

            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-red-200">operator phrase refused</p>
                <h2 className="mt-4 font-orbitron text-[clamp(3.75rem,12vw,8rem)] font-black uppercase leading-[0.82] tracking-[-0.06em] text-white">
                  Denied
                </h2>
                <p className="mt-5 max-w-md text-sm leading-6 text-red-100/70">
                  {vaultSettings.denialCopy}
                </p>
                <div className="denial-pulse mt-7 h-px max-w-lg bg-gradient-to-r from-red-200 via-red-300 to-transparent" />
              </div>

              <div className="border border-red-200/14 bg-red-950/[0.10] p-5 font-mono">
                <div className="mb-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-red-200">
                  <Cpu size={15} />
                  diagnostic record
                </div>
                <div className="space-y-4 text-xs uppercase tracking-[0.16em] text-red-100/75">
                  {deniedLogs.map((log, index) => (
                    <div key={log} className="flex gap-3 border-l border-red-200/20 pl-3">
                      <span className="text-red-300">0{index + 1}</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {accessPopupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/85 px-4 backdrop-blur-md animate-fade-in-up"
          role="dialog"
          aria-modal="true"
          aria-label="Request vault access"
        >
          <div className="vault-grid pointer-events-none absolute inset-0 opacity-25" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(56,189,248,0.13),transparent_38%),radial-gradient(circle_at_80%_88%,rgba(239,68,68,0.14),transparent_32%)]" />

          <div className="luxury-vault-shell relative w-full max-w-xl overflow-hidden border border-sky-200/15 bg-[#030711]/95 shadow-[0_40px_150px_rgba(0,0,0,0.88),0_0_70px_rgba(125,211,252,0.10)]">
            <div className="luxury-sweep pointer-events-none absolute inset-0" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent" />
            <button
              type="button"
              onClick={closeAccessPopup}
              aria-label="Close access request"
              className="absolute right-4 top-4 z-10 cursor-pointer rounded-full border border-white/10 bg-white/[0.03] p-2 text-slate-500 transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 motion-reduce:transition-none"
            >
              <X size={16} />
            </button>

            <div className="relative border-b border-white/10 bg-white/[0.025] px-6 py-7 sm:px-8">
              <div className="mb-6 inline-flex items-center gap-2 border border-red-200/18 bg-red-400/[0.07] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-red-100">
                <LockKeyhole size={14} />
                Access refused
              </div>
              <h2 className="font-orbitron text-4xl font-black uppercase leading-none tracking-[-0.04em] text-white sm:text-5xl">
                {vaultSettings.requestTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {vaultSettings.requestCopy}
              </p>
            </div>

            {accessSubmitted ? (
              <div className="relative px-6 py-8 sm:px-8">
                <div className="border border-emerald-200/18 bg-emerald-300/[0.075] p-5 shadow-[0_0_45px_rgba(16,185,129,0.08)]">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-emerald-200">
                    Request logged
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Your signal is in the queue. The vault is still closed for now.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={submitAccessRequest} className="relative space-y-4 px-6 py-7 sm:px-8">
                <label className="block space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-sky-200">Name</span>
                  <div className="flex items-center gap-3 border border-white/10 bg-black/50 px-3 py-3 transition-colors focus-within:border-sky-200/50 motion-reduce:transition-none">
                    <User size={16} className="text-slate-600" />
                    <input
                      value={accessName}
                      onChange={(event) => setAccessName(event.target.value)}
                      required
                      className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-700"
                      placeholder="Your name"
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-sky-200">Email</span>
                  <div className="flex items-center gap-3 border border-white/10 bg-black/50 px-3 py-3 transition-colors focus-within:border-sky-200/50 motion-reduce:transition-none">
                    <Mail size={16} className="text-slate-600" />
                    <input
                      type="email"
                      value={accessEmail}
                      onChange={(event) => setAccessEmail(event.target.value)}
                      required
                      className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-700"
                      placeholder="you@example.com"
                    />
                  </div>
                </label>

                {accessError && (
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-red-300">
                    {accessError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={accessSubmitting || !accessName.trim() || !accessEmail.trim()}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-3 bg-sky-200 px-5 py-4 font-orbitron text-xs font-bold uppercase tracking-[0.24em] text-slate-950 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                >
                  {accessSubmitting ? 'Logging Request' : 'Request Access'}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {easterEggOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md animate-fade-in-up"
          role="dialog"
          aria-modal="true"
          aria-label="Hidden vault signal"
        >
          <div className={`luxury-vault-shell easter-egg-${vaultSettings.easterEggVisual} relative w-full max-w-md overflow-hidden border bg-[#05070d]/95 p-6 shadow-[0_40px_140px_rgba(0,0,0,0.88)]`}>
            <div className="luxury-sweep pointer-events-none absolute inset-0" />
            <p className="relative font-mono text-[10px] uppercase tracking-[0.34em] text-current">
              hidden signal found
            </p>
            <h2 className="relative mt-4 font-orbitron text-3xl font-black uppercase tracking-[-0.04em] text-white">
              Quiet room
            </h2>
            <p className="relative mt-4 text-sm leading-6 text-slate-400">
              {vaultSettings.easterEggMessage}
            </p>
            <button
              type="button"
              onClick={() => setEasterEggOpen(false)}
              className="relative mt-6 w-full bg-amber-100 px-4 py-3 font-orbitron text-xs font-bold uppercase tracking-[0.24em] text-slate-950 transition-colors hover:bg-white motion-reduce:transition-none"
            >
              Close Signal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
