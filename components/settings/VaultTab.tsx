import React, { useEffect, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { KeyRound, Save } from 'lucide-react';
import { db } from '../../firebase';
import { VaultAnalyticsEvent, VaultSettings } from '../../types';

const DEFAULT_VAULT_PHRASE = 'show me';
const DEFAULT_TERMINAL_TITLE = 'Access Console';
const DEFAULT_DENIAL_COPY = 'Unauthorized but interesting. Request channel opened.';
const DEFAULT_REQUEST_TITLE = 'Private access request';
const DEFAULT_REQUEST_COPY = 'Leave a clean signal. If the public key changes, this is the request list Jared checks first.';
const DEFAULT_INTENSITY: NonNullable<VaultSettings['intensity']> = 'subtle';
const DEFAULT_EASTER_EGG_PHRASE = 'quiet room';
const DEFAULT_EASTER_EGG_MESSAGE = 'Hidden signal found. No access granted, just a private nod from the interface.';
const DEFAULT_EASTER_EGG_VISUAL: NonNullable<VaultSettings['easterEggVisual']> = 'amber';
type EditableVaultSettings = Required<Omit<VaultSettings, 'updatedAt'>>;

export const VaultTab: React.FC = () => {
  const [phrase, setPhrase] = useState(DEFAULT_VAULT_PHRASE);
  const [terminalTitle, setTerminalTitle] = useState(DEFAULT_TERMINAL_TITLE);
  const [denialCopy, setDenialCopy] = useState(DEFAULT_DENIAL_COPY);
  const [requestTitle, setRequestTitle] = useState(DEFAULT_REQUEST_TITLE);
  const [requestCopy, setRequestCopy] = useState(DEFAULT_REQUEST_COPY);
  const [intensity, setIntensity] = useState<NonNullable<VaultSettings['intensity']>>(DEFAULT_INTENSITY);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [easterEggPhrase, setEasterEggPhrase] = useState(DEFAULT_EASTER_EGG_PHRASE);
  const [easterEggMessage, setEasterEggMessage] = useState(DEFAULT_EASTER_EGG_MESSAGE);
  const [easterEggVisual, setEasterEggVisual] = useState<NonNullable<VaultSettings['easterEggVisual']>>(DEFAULT_EASTER_EGG_VISUAL);
  const [analytics, setAnalytics] = useState<VaultAnalyticsEvent[]>([]);
  const [savedSettings, setSavedSettings] = useState<EditableVaultSettings>({
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ref = doc(db, 'appSettings', 'vault');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.data() as VaultSettings | undefined;
      const nextSettings = {
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
      };
      setPhrase(nextSettings.phrase);
      setTerminalTitle(nextSettings.terminalTitle);
      setDenialCopy(nextSettings.denialCopy);
      setRequestTitle(nextSettings.requestTitle);
      setRequestCopy(nextSettings.requestCopy);
      setIntensity(nextSettings.intensity);
      setSoundEnabled(nextSettings.soundEnabled);
      setEasterEggPhrase(nextSettings.easterEggPhrase);
      setEasterEggMessage(nextSettings.easterEggMessage);
      setEasterEggVisual(nextSettings.easterEggVisual);
      setSavedSettings(nextSettings);
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'vaultAnalytics'), orderBy('createdAt', 'desc'), limit(100));
    return onSnapshot(q, (snapshot) => {
      setAnalytics(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as VaultAnalyticsEvent)));
    }, () => setAnalytics([]));
  }, []);

  const saveVaultSettings = async () => {
    const nextSettings = {
      phrase: phrase.trim(),
      terminalTitle: terminalTitle.trim() || DEFAULT_TERMINAL_TITLE,
      denialCopy: denialCopy.trim() || DEFAULT_DENIAL_COPY,
      requestTitle: requestTitle.trim() || DEFAULT_REQUEST_TITLE,
      requestCopy: requestCopy.trim() || DEFAULT_REQUEST_COPY,
      intensity,
      soundEnabled,
      easterEggPhrase: easterEggPhrase.trim() || DEFAULT_EASTER_EGG_PHRASE,
      easterEggMessage: easterEggMessage.trim() || DEFAULT_EASTER_EGG_MESSAGE,
      easterEggVisual,
    };
    if (!nextSettings.phrase) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'appSettings', 'vault'), {
        ...nextSettings,
        updatedAt: Date.now(),
      }, { merge: true });
      setSavedSettings(nextSettings);
    } finally {
      setSaving(false);
    }
  };

  const dirty =
    phrase.trim() !== savedSettings.phrase ||
    terminalTitle.trim() !== savedSettings.terminalTitle ||
    denialCopy.trim() !== savedSettings.denialCopy ||
    requestTitle.trim() !== savedSettings.requestTitle ||
    requestCopy.trim() !== savedSettings.requestCopy ||
    intensity !== savedSettings.intensity ||
    soundEnabled !== savedSettings.soundEnabled ||
    easterEggPhrase.trim() !== savedSettings.easterEggPhrase ||
    easterEggMessage.trim() !== savedSettings.easterEggMessage ||
    easterEggVisual !== savedSettings.easterEggVisual;

  const analyticsCounts = analytics.reduce<Record<VaultAnalyticsEvent['type'], number>>((counts, event) => {
    counts[event.type] += 1;
    return counts;
  }, { opened: 0, success: 0, denied: 0, easter: 0 });

  if (loading) {
    return (
      <div className="py-16 text-center font-mono text-xs text-zinc-600 animate-pulse">
        LOADING VAULT SETTINGS...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-[#0a0a0c] p-5">
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-300">
          <KeyRound size={18} />
        </div>
        <div>
          <h2 className="font-orbitron text-sm font-bold uppercase tracking-wider text-zinc-100">
            Vault Phrase
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
            This phrase is matched exactly in the landing terminal. Anything else gets the denied screen.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400/80">
          Exact unlock phrase
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={phrase}
            onChange={(event) => setPhrase(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && saveVaultSettings()}
            placeholder={DEFAULT_VAULT_PHRASE}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2.5 font-mono text-sm text-zinc-100 outline-none transition-colors placeholder-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
          <button
            onClick={saveVaultSettings}
            disabled={saving || !phrase.trim() || !dirty}
            className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-cyan-400 disabled:opacity-40"
          >
            <Save size={14} />
            {saving ? 'Saving' : 'Save'}
          </button>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-700">
          Current phrase: {savedSettings.phrase}
        </p>
      </div>

      <div className="grid gap-4">
        <label className="block space-y-2">
          <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400/80">
            Terminal title
          </span>
          <input
            value={terminalTitle}
            onChange={(event) => setTerminalTitle(event.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400/80">
            Denial copy
          </span>
          <textarea
            value={denialCopy}
            onChange={(event) => setDenialCopy(event.target.value)}
            rows={2}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400/80">
              Request title
            </span>
            <input
              value={requestTitle}
              onChange={(event) => setRequestTitle(event.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400/80">
              Intensity
            </span>
            <select
              value={intensity}
              onChange={(event) => setIntensity(event.target.value as NonNullable<VaultSettings['intensity']>)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="subtle">Subtle premium</option>
              <option value="cinematic">Cinematic</option>
              <option value="chaos">Chaos</option>
            </select>
          </label>
        </div>

        <label className="block space-y-2">
          <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400/80">
            Request copy
          </span>
          <textarea
            value={requestCopy}
            onChange={(event) => setRequestCopy(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors placeholder-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </label>

        <button
          type="button"
          onClick={() => setSoundEnabled((current) => !current)}
          className={`w-fit rounded-lg border px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] transition-colors ${
            soundEnabled
              ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'
              : 'border-zinc-700 bg-zinc-900/50 text-zinc-500'
          }`}
        >
          Sound design: {soundEnabled ? 'enabled' : 'muted'}
        </button>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#0a0a0c] p-5">
        <h3 className="font-orbitron text-sm font-bold uppercase tracking-wider text-zinc-100">
          Vault Analytics
        </h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            ['Opened', analyticsCounts.opened],
            ['Success', analyticsCounts.success],
            ['Denied', analyticsCounts.denied],
            ['Easter', analyticsCounts.easter],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">{label}</p>
              <p className="mt-2 text-2xl font-black text-zinc-100">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-700">
          Showing last {analytics.length} public-safe vault events.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#0a0a0c] p-5">
        <h3 className="font-orbitron text-sm font-bold uppercase tracking-wider text-zinc-100">
          Configurable Easter Egg
        </h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          The terminal secret phrase and hidden sigil double-click reveal a harmless bonus state. This never grants access.
        </p>
        <div className="mt-5 grid gap-4">
          <label className="block space-y-2">
            <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400/80">
              Secret phrase
            </span>
            <input
              value={easterEggPhrase}
              onChange={(event) => setEasterEggPhrase(event.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2.5 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400/80">
              Bonus message
            </span>
            <textarea
              value={easterEggMessage}
              onChange={(event) => setEasterEggMessage(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </label>

          <label className="block space-y-2">
            <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400/80">
              Visual state
            </span>
            <select
              value={easterEggVisual}
              onChange={(event) => setEasterEggVisual(event.target.value as NonNullable<VaultSettings['easterEggVisual']>)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="amber">Amber</option>
              <option value="emerald">Emerald</option>
              <option value="rose">Rose</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
};
