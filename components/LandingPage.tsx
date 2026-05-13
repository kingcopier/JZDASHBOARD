import React, { useEffect, useRef, useState } from 'react';
import { addDoc, collection, doc, onSnapshot } from 'firebase/firestore';
import {
  ArrowRight,
  Bitcoin,
  Boxes,
  ChevronDown,
  Mail,
  Orbit,
  ScanSearch,
  Shield,
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

const SecretSigil: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    window.setTimeout(onClick, 500);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
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
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalValue, setTerminalValue] = useState('');
  const [deniedActive, setDeniedActive] = useState(false);
  const [accessPopupOpen, setAccessPopupOpen] = useState(false);
  const [accessName, setAccessName] = useState('');
  const [accessEmail, setAccessEmail] = useState('');
  const [accessSubmitting, setAccessSubmitting] = useState(false);
  const [accessSubmitted, setAccessSubmitted] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [vaultPhrase, setVaultPhrase] = useState(DEFAULT_VAULT_PHRASE);
  const enterButtonRef = useRef<HTMLButtonElement | null>(null);
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
      setVaultPhrase(data?.phrase || DEFAULT_VAULT_PHRASE);
    }, () => {
      setVaultPhrase(DEFAULT_VAULT_PHRASE);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!terminalOpen) return undefined;
    const timer = window.setTimeout(() => terminalInputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [terminalOpen]);

  useEffect(() => {
    if (!deniedActive) return undefined;
    const timer = window.setTimeout(() => {
      setDeniedActive(false);
      setTerminalOpen(false);
      setTerminalValue('');
      setAccessPopupOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [deniedActive]);

  const openVaultTerminal = () => {
    if (terminalOpen || deniedActive) return;
    setTerminalValue('');
    setTerminalOpen(true);
  };

  useEffect(() => {
    const handleNativeStart = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest('[data-vault-trigger="true"]')) return;
      openVaultTerminal();
    };

    document.addEventListener('click', handleNativeStart, true);
    document.addEventListener('pointerdown', handleNativeStart, true);

    return () => {
      document.removeEventListener('click', handleNativeStart, true);
      document.removeEventListener('pointerdown', handleNativeStart, true);
    };
  }, [terminalOpen, deniedActive]);

  const submitTerminal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (terminalValue === vaultPhrase) {
      onEnterVault();
      return;
    }

    setDeniedActive(true);
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

        <main className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-12">
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
                ref={enterButtonRef}
                data-vault-trigger="true"
                type="button"
                onClick={openVaultTerminal}
                onPointerDown={openVaultTerminal}
                disabled={terminalOpen || deniedActive}
                className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-2xl bg-sky-300 px-6 py-4 font-orbitron text-sm font-bold uppercase tracking-[0.24em] text-slate-950 transition-all duration-200 hover:bg-sky-200 hover:shadow-[0_0_45px_rgba(125,211,252,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-100 disabled:cursor-wait disabled:opacity-80 motion-reduce:transition-none"
              >
                {terminalOpen || deniedActive ? 'Terminal Open' : 'Enter The Vault'}
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
        <SecretSigil onClick={openVaultTerminal} />
      </div>

      {terminalOpen && !deniedActive && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black px-4 animate-fade-in-up"
          role="dialog"
          aria-modal="true"
          aria-label="Vault terminal"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'linear-gradient(rgba(125,211,252,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,0.12) 1px, transparent 1px)',
              backgroundSize: '38px 38px',
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(125,211,252,0.06)_51%)] bg-[length:100%_8px]" />

          <div className="relative w-full max-w-4xl border border-sky-300/20 bg-[#020409] shadow-[0_40px_160px_rgba(0,0,0,0.85)]">
            <div className="flex items-center justify-between border-b border-sky-300/15 bg-white/[0.03] px-5 py-4 font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
              <span>vault-terminal</span>
              <button
                type="button"
                onClick={() => {
                  setTerminalOpen(false);
                  setTerminalValue('');
                }}
                className="cursor-pointer text-slate-600 transition-colors hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                close
              </button>
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-8 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.22em] text-sky-300">
                <Terminal size={17} />
                <span>blank shell waiting for operator phrase</span>
              </div>

              <form onSubmit={submitTerminal} className="font-mono">
                <div className="min-h-80 border border-white/10 bg-black p-5 text-slate-400 sm:p-7">
                  <div className="mb-6 text-[11px] uppercase tracking-[0.24em] text-slate-700">
                    no hints loaded / exact phrase required / lowercase accepted only
                  </div>
                  <label className="flex items-center gap-3 text-lg text-slate-200 sm:text-2xl">
                    <span className="text-sky-300">zander@vault:~$</span>
                    <input
                      ref={terminalInputRef}
                      value={terminalValue}
                      onChange={(event) => setTerminalValue(event.target.value)}
                      spellCheck={false}
                      autoComplete="off"
                      aria-label="Vault terminal command"
                      className="min-w-0 flex-1 bg-transparent font-mono text-slate-100 outline-none caret-sky-300"
                    />
                  </label>
                  <button type="submit" className="sr-only">
                    Submit terminal command
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deniedActive && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-red-950 px-4 text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-45"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.22) 0, rgba(255,255,255,0.22) 1px, transparent 1px, transparent 4px)',
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(0,0,0,0.72)_72%)]" />
          <div className="relative text-center">
            <p className="mb-5 font-mono text-sm uppercase tracking-[0.45em] text-red-100">
              invalid phrase / redirecting home
            </p>
            <h2 className="font-orbitron text-[clamp(5rem,18vw,14rem)] font-black uppercase leading-none tracking-normal text-white">
              Denied
            </h2>
            <div className="mx-auto mt-7 h-3 max-w-xl bg-white shadow-[0_0_45px_rgba(255,255,255,0.65)]" />
          </div>
        </div>
      )}

      {accessPopupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md animate-fade-in-up"
          role="dialog"
          aria-modal="true"
          aria-label="Request vault access"
        >
          <div className="relative w-full max-w-lg border border-sky-300/20 bg-[#05070d] shadow-[0_40px_140px_rgba(0,0,0,0.8)]">
            <button
              type="button"
              onClick={closeAccessPopup}
              aria-label="Close access request"
              className="absolute right-4 top-4 cursor-pointer rounded-full border border-white/10 bg-white/[0.03] p-2 text-slate-500 transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              <X size={16} />
            </button>

            <div className="border-b border-white/10 px-6 py-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-red-300">
                Access refused
              </p>
              <h2 className="mt-3 font-orbitron text-3xl font-black uppercase tracking-normal text-white">
                Want the next key?
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Drop your name and email. If the public key changes, you will be on the request list.
              </p>
            </div>

            {accessSubmitted ? (
              <div className="px-6 py-8">
                <div className="border border-emerald-300/20 bg-emerald-300/10 p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-emerald-200">
                    Request logged
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Your signal is in the queue. The vault is still closed for now.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={submitAccessRequest} className="space-y-4 px-6 py-6">
                <label className="block space-y-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-sky-300">Name</span>
                  <div className="flex items-center gap-3 border border-white/10 bg-black/40 px-3 py-3 focus-within:border-sky-300/50">
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
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-sky-300">Email</span>
                  <div className="flex items-center gap-3 border border-white/10 bg-black/40 px-3 py-3 focus-within:border-sky-300/50">
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
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-3 bg-sky-300 px-5 py-4 font-orbitron text-xs font-bold uppercase tracking-[0.24em] text-slate-950 transition-colors hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {accessSubmitting ? 'Logging Request' : 'Request Access'}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
