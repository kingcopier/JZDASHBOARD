import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { LinkItem } from '../types';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { LinkCard } from './LinkCard';
import { SkeletonCard } from './SkeletonCard';
import { ProjectDetail } from './ProjectDetail';
import { doc, updateDoc, increment } from 'firebase/firestore';

interface PublicProjectsViewProps {
  onBack: () => void;
}

export const PublicProjectsView: React.FC<PublicProjectsViewProps> = ({ onBack }) => {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [missionBriefingOpen, setMissionBriefingOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailLink, setDetailLink] = useState<LinkItem | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'links'),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setLinks(snap.docs.map(d => ({ id: d.id, ...d.data() } as LinkItem)));
      setIsLoading(false);
    }, () => setIsLoading(false));

    return unsub;
  }, []);

  useEffect(() => {
    if (isLoading) return undefined;
    const timer = window.setTimeout(() => setMissionBriefingOpen(false), 2600);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  const filtered = links.filter(l => {
    const t = searchTerm.toLowerCase();
    return !t || l.title.toLowerCase().includes(t) || l.description.toLowerCase().includes(t);
  });

  const handleView = async (link: LinkItem) => {
    setDetailLink(link);
    try {
      await updateDoc(doc(db, 'links', link.id), { viewCount: increment(1) });
    } catch { /* silent */ }
  };

  return (
    <div className="public-vault-entry min-h-screen bg-[#020202] text-zinc-100 overflow-x-hidden">
      {missionBriefingOpen && !isLoading && (
        <div className="mission-briefing fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black px-4 text-white">
          <div className="vault-grid pointer-events-none absolute inset-0 opacity-25" />
          <div className="precision-scanline pointer-events-none absolute inset-0 opacity-35" />
          <div className="relative w-full max-w-3xl border border-cyan-200/15 bg-[#030711]/92 p-6 shadow-[0_40px_160px_rgba(0,0,0,0.9),0_0_80px_rgba(125,211,252,0.12)] sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-cyan-200">
              Mission briefing
            </p>
            <h2 className="mt-4 font-orbitron text-4xl font-black uppercase leading-none tracking-[-0.05em] text-white sm:text-6xl">
              Archive decrypted
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="border border-white/10 bg-white/[0.03] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">records</p>
                <p className="mt-2 text-3xl font-black text-white">{links.length}</p>
              </div>
              <div className="border border-white/10 bg-white/[0.03] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">access</p>
                <p className="mt-2 text-3xl font-black text-emerald-200">read</p>
              </div>
              <div className="border border-white/10 bg-white/[0.03] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">status</p>
                <p className="mt-2 text-3xl font-black text-cyan-200">live</p>
              </div>
            </div>
            <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">
              Public systems only / no admin records exposed
            </p>
          </div>
        </div>
      )}

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-purple-600/8 rounded-full blur-[128px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={onBack}
            className="flex items-center gap-2 font-mono text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft size={14} />
            <span className="tracking-wider uppercase">Back</span>
          </button>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0a0c] border border-cyan-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">
                PUBLIC VAULT · READ ACCESS
              </span>
            </div>
          </div>

          <div className="w-20" /> {/* spacer to center the pill */}
        </div>

        {/* Title */}
        <div className="archive-decrypt text-center mb-12 space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan-300/80">
            Decrypted archive loaded
          </p>
          <h1 className="font-orbitron font-black text-4xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 uppercase tracking-tighter">
            The Vault
          </h1>
          <p className="text-zinc-500 font-mono text-sm">
            Selected works — public access tier
          </p>
        </div>

        {/* Search */}
        <div className="relative group max-w-lg mx-auto mb-10">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={16} className="text-zinc-600 group-focus-within:text-cyan-400 transition-colors" />
          </div>
          <input
            type="text"
            aria-label="Search projects"
            className="block w-full pl-10 pr-4 py-3.5 bg-[#0a0a0c]/80 backdrop-blur-xl border border-zinc-800/80 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono text-sm"
            placeholder="SEARCH..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((link, index) => (
              <div key={link.id} className="classified-record relative" style={{ animationDelay: `${220 + index * 90}ms` }}>
                <div className="pointer-events-none absolute left-4 top-4 z-10 border border-cyan-200/20 bg-black/70 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-cyan-100">
                  Case file {String(index + 1).padStart(2, '0')}
                </div>
                <div className="pointer-events-none absolute right-4 top-4 z-10 border border-red-200/20 bg-red-950/40 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-red-100">
                  declassified
                </div>
                <LinkCard
                  link={link}
                  index={index}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onView={handleView}
                  isAuthenticated={false}
                  style={{ animationDelay: `${index * 60}ms` }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border border-dashed border-zinc-800 rounded-3xl">
            <p className="font-orbitron font-bold text-zinc-600 tracking-wider">
              {searchTerm ? 'NO MATCHES FOUND' : 'VAULT EMPTY'}
            </p>
            <p className="font-mono text-xs text-zinc-700 mt-2">
              {searchTerm ? 'Try a different search term.' : 'No public projects deployed yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {detailLink && (
        <ProjectDetail link={detailLink} onClose={() => setDetailLink(null)} />
      )}
    </div>
  );
};
