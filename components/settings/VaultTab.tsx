import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { KeyRound, Save } from 'lucide-react';
import { db } from '../../firebase';
import { VaultSettings } from '../../types';

const DEFAULT_VAULT_PHRASE = 'show me';

export const VaultTab: React.FC = () => {
  const [phrase, setPhrase] = useState(DEFAULT_VAULT_PHRASE);
  const [savedPhrase, setSavedPhrase] = useState(DEFAULT_VAULT_PHRASE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ref = doc(db, 'appSettings', 'vault');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.data() as VaultSettings | undefined;
      const nextPhrase = data?.phrase || DEFAULT_VAULT_PHRASE;
      setPhrase(nextPhrase);
      setSavedPhrase(nextPhrase);
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const savePhrase = async () => {
    const nextPhrase = phrase.trim();
    if (!nextPhrase) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'appSettings', 'vault'), {
        phrase: nextPhrase,
        updatedAt: Date.now(),
      }, { merge: true });
      setSavedPhrase(nextPhrase);
    } finally {
      setSaving(false);
    }
  };

  const dirty = phrase.trim() !== savedPhrase;

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
            onKeyDown={(event) => event.key === 'Enter' && savePhrase()}
            placeholder={DEFAULT_VAULT_PHRASE}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2.5 font-mono text-sm text-zinc-100 outline-none transition-colors placeholder-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
          <button
            onClick={savePhrase}
            disabled={saving || !phrase.trim() || !dirty}
            className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-cyan-400 disabled:opacity-40"
          >
            <Save size={14} />
            {saving ? 'Saving' : 'Save'}
          </button>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-700">
          Current phrase: {savedPhrase}
        </p>
      </div>
    </div>
  );
};
