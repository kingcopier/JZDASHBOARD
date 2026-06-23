import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Package, Globe, Star, Shield } from 'lucide-react';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, increment,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../firebase';
import { SkillItem, CategoryItem, UserRole, ProjectVisibility } from '../types';
import { SkillCard } from './SkillCard';
import { SkillDetail } from './SkillDetail';
import { SkillForm } from './SkillForm';
import { SkeletonCard } from './SkeletonCard';
import { Modal } from './Modal';
import { Button } from './Button';

// Which skill visibilities can each role see? Mirrors App.tsx VISIBLE_FOR_ROLE.
const VISIBLE_FOR_ROLE: Record<UserRole, ProjectVisibility[]> = {
  pending: ['public'],
  public:  ['public'],
  vip:     ['public', 'vip'],
  admin:   ['public', 'vip', 'admin'],
};

interface SkillsPanelProps {
  userRole: UserRole;
  user: User | null;
  categories: CategoryItem[];
  isAdmin: boolean;
}

export const SkillsPanel: React.FC<SkillsPanelProps> = ({ userRole, user, categories, isAdmin }) => {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVisibility, setSelectedVisibility] = useState<ProjectVisibility | 'All'>('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillItem | null>(null);
  const [detailSkill, setDetailSkill] = useState<SkillItem | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'skills'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      snap => { setSkills(snap.docs.map(d => ({ id: d.id, ...d.data() } as SkillItem))); setIsLoading(false); },
      () => setIsLoading(false),
    );
  }, []);

  const filteredSkills = useMemo(() => {
    const allowed = VISIBLE_FOR_ROLE[userRole];
    return skills.filter(skill => {
      if (!allowed.includes(skill.visibility)) return false;
      if (selectedVisibility !== 'All' && skill.visibility !== selectedVisibility) return false;
      if (selectedCategory !== 'All' && skill.category !== selectedCategory) return false;
      const term = searchTerm.toLowerCase();
      if (term) {
        return (
          skill.name.toLowerCase().includes(term) ||
          skill.description.toLowerCase().includes(term) ||
          (skill.tags ?? []).some(t => t.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [skills, searchTerm, selectedCategory, selectedVisibility, userRole]);

  const handleSave = async (data: Omit<SkillItem, 'id' | 'createdAt'>) => {
    if (!user) return;
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    try {
      if (editingSkill) {
        await updateDoc(doc(db, 'skills', editingSkill.id), { ...clean, updatedAt: Date.now() });
      } else {
        await addDoc(collection(db, 'skills'), {
          ...clean,
          createdAt: Date.now(),
          authorUid: user.uid,
          downloadCount: 0,
        });
      }
      setModalOpen(false);
      setEditingSkill(null);
    } catch (err) {
      console.error('Error saving skill:', err);
      alert('Failed to save skill');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Remove this skill?')) {
      try { await deleteDoc(doc(db, 'skills', id)); }
      catch (err) { console.error(err); alert('Failed to delete'); }
    }
  };

  const handleDownload = async (skill: SkillItem) => {
    try { await updateDoc(doc(db, 'skills', skill.id), { downloadCount: increment(1) }); }
    catch { /* silent — the download link still works */ }
  };

  return (
    <>
      {/* Controls */}
      <div className="sticky top-4 z-30 mb-12 space-y-3">
        <div className="flex gap-3">
          <div className="relative group flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={16} className="text-zinc-500 group-focus-within:text-amber-400 transition-colors" />
            </div>
            <input
              type="text"
              aria-label="Search skills"
              className="block w-full pl-10 pr-4 py-3 bg-[#0a0a0c]/80 backdrop-blur-xl border border-zinc-800/80 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all shadow-lg font-mono text-sm"
              placeholder="SEARCH_SKILLS..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && (
            <Button onClick={() => { setEditingSkill(null); setModalOpen(true); }} icon={<Plus size={18} />}>
              Add Skill
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all border whitespace-nowrap ${
              selectedCategory === 'All'
                ? 'bg-amber-950/30 text-amber-400 border-amber-500/50 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                : 'bg-[#0a0a0c]/80 text-zinc-500 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-300'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all border whitespace-nowrap ${
                selectedCategory === cat.name
                  ? 'bg-amber-950/30 text-amber-400 border-amber-500/50 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                  : 'bg-[#0a0a0c]/80 text-zinc-500 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {cat.name}
            </button>
          ))}

          {isAdmin && (
            <>
              <div className="w-px h-5 bg-zinc-800/80 mx-0.5" />
              {(['All', 'public', 'vip', 'admin'] as const).map(v => {
                const icons = { All: null, public: <Globe size={10} />, vip: <Star size={10} />, admin: <Shield size={10} /> };
                return (
                  <button
                    key={v}
                    onClick={() => setSelectedVisibility(v)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all border whitespace-nowrap ${
                      selectedVisibility === v
                        ? 'bg-purple-950/30 text-purple-400 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.12)]'
                        : 'bg-[#0a0a0c]/80 text-zinc-600 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-400'
                    }`}
                  >
                    {icons[v]}
                    {v}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Grid */}
      <section aria-label="Skills">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredSkills.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkills.map((skill, index) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                index={index}
                onView={setDetailSkill}
                onEdit={s => { setEditingSkill(s); setModalOpen(true); }}
                onDelete={handleDelete}
                isAdmin={isAdmin}
                style={{ animationDelay: `${index * 60}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/10 backdrop-blur-sm animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900/50 border border-zinc-800 mb-4 text-zinc-600">
              <Package size={24} />
            </div>
            <h3 className="text-lg font-bold text-zinc-300 font-orbitron">NO SKILLS FOUND</h3>
            <p className="text-zinc-600 mt-2 font-mono text-xs">
              {searchTerm || selectedCategory !== 'All'
                ? 'TRY ADJUSTING YOUR FILTERS.'
                : isAdmin
                ? 'HIT "ADD SKILL" TO UPLOAD YOUR FIRST .SKILL.'
                : 'NOTHING HERE YET.'}
            </p>
          </div>
        )}
      </section>

      {/* Detail */}
      {detailSkill && (
        <SkillDetail skill={detailSkill} onClose={() => setDetailSkill(null)} onDownload={handleDownload} />
      )}

      {/* Add / Edit */}
      {isAdmin && (
        <Modal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditingSkill(null); }}
          title={editingSkill ? 'MODIFY SKILL' : 'ADD NEW SKILL'}
        >
          <SkillForm
            initialData={editingSkill}
            categories={categories}
            onSubmit={handleSave}
            onCancel={() => { setModalOpen(false); setEditingSkill(null); }}
          />
        </Modal>
      )}
    </>
  );
};
