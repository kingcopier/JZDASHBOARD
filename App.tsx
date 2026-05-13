import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Zap, LogOut, Cpu, ArrowUpDown, Clock, Settings, Star, Shield, Globe } from 'lucide-react';
import { LinkItem, CategoryItem, UserRole, ProjectVisibility } from './types';
import { LinkCard } from './components/LinkCard';
import { SkeletonCard } from './components/SkeletonCard';
import { Modal } from './components/Modal';
import { LinkForm } from './components/LinkForm';
import { ProjectDetail } from './components/ProjectDetail';
import { Button } from './components/Button';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { PendingApproval } from './components/PendingApproval';
import { PublicProjectsView } from './components/PublicProjectsView';
import { SettingsPage } from './components/SettingsPage';
import { auth, db, ensureUserDoc } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  collection, query, orderBy, onSnapshot,
  deleteDoc, doc, addDoc, updateDoc, increment,
} from 'firebase/firestore';

type AppView = 'landing' | 'public' | 'login' | 'dashboard' | 'settings';
type SortOrder = 'newest' | 'oldest';

// Which project visibilities can each role see?
const VISIBLE_FOR_ROLE: Record<UserRole, ProjectVisibility[]> = {
  pending: ['public'],
  public:  ['public'],
  vip:     ['public', 'vip'],
  admin:   ['public', 'vip', 'admin'],
};

const App: React.FC = () => {
  // ── View routing ────────────────────────────────────────────────────────────
  const [view, setView] = useState<AppView>('landing');

  // ── Auth ────────────────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('public');
  const [authReady, setAuthReady] = useState(false);

  // ── Data ────────────────────────────────────────────────────────────────────
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedVisibility, setSelectedVisibility] = useState<ProjectVisibility | 'All'>('All');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [detailLink, setDetailLink] = useState<LinkItem | null>(null);

  // ── Auth listener ────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const role = await ensureUserDoc(firebaseUser);
        setUserRole(role);

        if (role === 'pending') {
          setView('login'); // Shows pending screen (handled below)
        } else {
          setView('dashboard');
        }
      } else {
        setUserRole('public');
      }

      setAuthReady(true);
    });
    return unsub;
  }, []);

  // ── Links listener ────────────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'links'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setLinks(snap.docs.map(d => ({ id: d.id, ...d.data() } as LinkItem)));
      setIsLoading(false);
    }, () => setIsLoading(false));
  }, []);

  // ── Categories listener ───────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    return onSnapshot(q, snap => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as CategoryItem)));
    });
  }, []);

  // ── Filtered links ───────────────────────────────────────────────────────────
  const filterKey = `${selectedCategory}-${searchTerm}-${sortOrder}-${selectedVisibility}`;

  const filteredLinks = useMemo(() => {
    const allowedVisibilities = VISIBLE_FOR_ROLE[userRole];

    const filtered = links.filter(link => {
      // Role gate
      if (!allowedVisibilities.includes(link.visibility)) return false;
      // Visibility filter chip
      if (selectedVisibility !== 'All' && link.visibility !== selectedVisibility) return false;
      // Category filter
      if (selectedCategory !== 'All' && link.category !== selectedCategory) return false;
      // Search
      const term = searchTerm.toLowerCase();
      if (term) {
        return (
          link.title.toLowerCase().includes(term) ||
          link.description.toLowerCase().includes(term) ||
          (link.tags ?? []).some(t => t.toLowerCase().includes(term))
        );
      }
      return true;
    });

    return sortOrder === 'oldest' ? [...filtered].reverse() : filtered;
  }, [links, searchTerm, selectedCategory, selectedVisibility, sortOrder, userRole]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setUserRole('public');
    setView('landing');
  };

  const handleView = async (link: LinkItem) => {
    setDetailLink(link);
    try {
      await updateDoc(doc(db, 'links', link.id), { viewCount: increment(1) });
    } catch { /* silent */ }
  };

  const handleSave = async (data: Omit<LinkItem, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      if (editingLink) {
        await updateDoc(doc(db, 'links', editingLink.id), { ...data, updatedAt: Date.now() });
      } else {
        await addDoc(collection(db, 'links'), {
          ...data,
          createdAt: Date.now(),
          authorUid: user.uid,
          viewCount: 0,
        });
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Error saving link:', err);
      alert('Failed to save link');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (window.confirm('Remove this project?')) {
      try { await deleteDoc(doc(db, 'links', id)); }
      catch (err) { console.error(err); alert('Failed to delete'); }
    }
  };

  // ── Route to correct view ─────────────────────────────────────────────────────

  if (!authReady) return null; // Wait silently for auth to resolve

  if (view === 'landing') {
    return (
      <LandingPage
        onEnterVault={() => setView('public')}
        onLoginClick={() => setView('login')}
      />
    );
  }

  if (view === 'login') {
    if (user && userRole === 'pending') {
      return <PendingApproval email={user.email ?? ''} onLogout={handleLogout} />;
    }
    return (
      <LoginPage
        onSuccess={() => { /* auth listener handles routing */ }}
        onCancel={() => setView('landing')}
      />
    );
  }

  if (view === 'public') {
    return <PublicProjectsView onBack={() => setView('landing')} />;
  }

  if (view === 'settings' && userRole === 'admin') {
    return <SettingsPage onBack={() => setView('dashboard')} />;
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────────

  const isAdmin = userRole === 'admin';
  const isVip = userRole === 'vip';

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 selection:bg-cyan-500/30 overflow-x-hidden">

      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[128px]" />
        <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">

        {/* ── Header ── */}
        <header className="relative flex flex-col items-center justify-center text-center mb-16 space-y-6">

          {/* Role pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a0a0c] border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-cyan-400 font-bold">
              Operator: Jared
              {isVip && <span className="ml-2 text-purple-400">· VIP</span>}
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 font-orbitron text-glow uppercase leading-none max-w-4xl">
            Project<br />
            <span className="text-white">Database</span>
          </h1>

          <p className="text-zinc-400 max-w-xl text-lg font-light leading-relaxed">
            Access denied to mediocrity. Welcome to my personal collection of code, designs, and digital artifacts.
          </p>

          {/* Admin/user controls */}
          <div className="flex gap-3 flex-wrap justify-center sm:absolute sm:top-0 sm:right-0">
            {isAdmin && (
              <Button
                onClick={() => setView('settings')}
                variant="ghost"
                icon={<Settings size={16} />}
                aria-label="Settings"
              >
                Settings
              </Button>
            )}
            <Button onClick={handleLogout} variant="ghost" icon={<LogOut size={16} />}>
              Logout
            </Button>
            {isAdmin && (
              <Button
                onClick={() => { setEditingLink(null); setModalOpen(true); }}
                size="lg"
                icon={<Plus size={20} />}
              >
                Add Project
              </Button>
            )}
          </div>
        </header>

        <main>
          {/* ── Controls ── */}
          <div className="sticky top-4 z-30 mb-12 space-y-3">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative group flex-grow">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={18} className="text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                </div>
                <input
                  type="text"
                  aria-label="Search projects"
                  className="block w-full pl-11 pr-4 py-4 bg-[#0a0a0c]/80 backdrop-blur-xl border border-zinc-800/80 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-lg font-mono text-sm"
                  placeholder="SEARCH_PROJECTS..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center">
                {/* Category filters */}
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-4 py-3.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all border whitespace-nowrap ${
                    selectedCategory === 'All'
                      ? 'bg-cyan-950/30 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-[#0a0a0c]/80 text-zinc-500 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-4 py-3.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all border whitespace-nowrap ${
                      selectedCategory === cat.name
                        ? 'bg-cyan-950/30 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-[#0a0a0c]/80 text-zinc-500 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}

                {/* Visibility filter — admin only */}
                {isAdmin && (
                  <>
                    <div className="w-px h-6 bg-zinc-800 mx-1" />
                    {(['All', 'public', 'vip', 'admin'] as const).map(v => {
                      const icons = { All: null, public: <Globe size={11} />, vip: <Star size={11} />, admin: <Shield size={11} /> };
                      return (
                        <button
                          key={v}
                          onClick={() => setSelectedVisibility(v)}
                          className={`flex items-center gap-1.5 px-3 py-3.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all border whitespace-nowrap ${
                            selectedVisibility === v
                              ? 'bg-purple-950/30 text-purple-400 border-purple-500/50'
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

                {/* Sort */}
                <div className="w-px h-6 bg-zinc-800 mx-1" />
                <button
                  onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')}
                  aria-label="Toggle sort order"
                  className="flex items-center gap-2 px-4 py-3.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all border whitespace-nowrap bg-[#0a0a0c]/80 text-zinc-500 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-300"
                >
                  {sortOrder === 'newest' ? <Clock size={13} /> : <ArrowUpDown size={13} />}
                  {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Grid ── */}
          <section aria-label="Projects">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filteredLinks.length > 0 ? (
              <div key={filterKey} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLinks.map((link, index) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    index={index}
                    onEdit={l => { setEditingLink(l); setModalOpen(true); }}
                    onDelete={handleDelete}
                    onView={handleView}
                    isAuthenticated={isAdmin}
                    style={{ animationDelay: `${index * 60}ms` }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/10 backdrop-blur-sm animate-fade-in-up">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900/50 border border-zinc-800 mb-4 text-zinc-600">
                  <Cpu size={24} />
                </div>
                <h3 className="text-lg font-bold text-zinc-300 font-orbitron">NO ARTIFACTS FOUND</h3>
                <p className="text-zinc-600 mt-2 font-mono text-xs">
                  {searchTerm || selectedCategory !== 'All'
                    ? 'TRY ADJUSTING YOUR FILTERS.'
                    : isAdmin
                    ? 'HIT "ADD PROJECT" TO DEPLOY YOUR FIRST ARTIFACT.'
                    : 'NOTHING HERE YET.'}
                </p>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Detail panel */}
      {detailLink && <ProjectDetail link={detailLink} onClose={() => setDetailLink(null)} />}

      {/* Add/Edit modal */}
      {isAdmin && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingLink ? 'MODIFY PROJECT' : 'DEPLOY NEW PROJECT'}
        >
          <LinkForm
            initialData={editingLink}
            categories={categories}
            onSubmit={handleSave}
            onCancel={() => setModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default App;
