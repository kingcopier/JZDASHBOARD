import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, LayoutGrid, Zap, Loader2, Bitcoin, LogOut, Terminal, Cpu } from 'lucide-react';
import { LinkItem, CATEGORIES, Category } from './types';
import { LinkCard } from './components/LinkCard';
import { Modal } from './components/Modal';
import { LinkForm } from './components/LinkForm';
import { LoginForm } from './components/LoginForm';
import { Button } from './components/Button';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  addDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

const App: React.FC = () => {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [user, setUser] = useState<User | null>(null);
  
  // Modal State
  const [modalType, setModalType] = useState<'link' | 'login' | null>(null);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  useEffect(() => {
    // Listen for auth changes
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Real-time links listener
    const q = query(collection(db, 'links'), orderBy('createdAt', 'desc'));
    const unsubscribeLinks = onSnapshot(q, (snapshot) => {
      const mappedLinks: LinkItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LinkItem));
      setLinks(mappedLinks);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching links:', error);
      setIsLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeLinks();
    };
  }, []);

  const filteredLinks = useMemo(() => {
    return links.filter(link => {
      const matchesSearch = 
        link.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        link.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || link.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [links, searchTerm, selectedCategory]);

  const handleAddClick = () => {
    setEditingLink(null);
    setModalType('link');
  };

  const handleEditClick = (link: LinkItem) => {
    setEditingLink(link);
    setModalType('link');
  };

  const handleDeleteClick = async (id: string) => {
    if (!user) return;
    
    if (window.confirm('Are you sure you want to remove this project?')) {
      try {
        await deleteDoc(doc(db, 'links', id));
      } catch (error) {
        console.error('Error deleting link:', error);
        alert('Failed to delete project');
      }
    }
  };

  const handleSave = async (data: Omit<LinkItem, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      if (editingLink) {
        // Update existing
        await updateDoc(doc(db, 'links', editingLink.id), {
          ...data,
          updatedAt: Date.now()
        });
      } else {
        // Create new
        await addDoc(collection(db, 'links'), {
          ...data,
          createdAt: Date.now(),
          authorUid: user.uid
        });
      }
      setModalType(null);
    } catch (error) {
      console.error('Error saving link:', error);
      alert('Failed to save link');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Background Gradients & Glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[128px]" />
        <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        
        {/* Header Section */}
        <header className="flex flex-col items-center justify-center text-center mb-16 space-y-6">
            
            {/* System Online Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a0a0c] border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-cyan-400 font-bold">Operator: Jared</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 font-orbitron text-glow uppercase leading-none max-w-4xl">
              Project<br />
              <span className="text-white">Database</span>
            </h1>
            
            <p className="text-zinc-400 max-w-xl text-lg font-light leading-relaxed">
              Access denied to mediocrity. Welcome to my personal collection of code, designs, and digital artifacts.
            </p>

            <div className="absolute top-8 right-8">
              {user ? (
                 <div className="flex gap-3">
                   <Button onClick={handleLogout} variant="ghost" icon={<LogOut size={18} />}>
                     Logout
                   </Button>
                   <Button onClick={handleAddClick} size="lg" icon={<Plus size={20} />}>
                     Add Project
                   </Button>
                 </div>
               ) : (
                  <Button onClick={() => setModalType('login')} variant="ghost" aria-label="Admin login" className="text-zinc-600 hover:text-cyan-400 hover:bg-cyan-950/30">
                    <Bitcoin size={20} />
                  </Button>
               )}
            </div>
        </header>

        <main>
        {/* Controls Section */}
        <div className="sticky top-4 z-30 mb-12 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar with Tech Styling */}
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
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar items-center md:pb-0">
                  <button
                      onClick={() => setSelectedCategory('All')}
                      className={`
                          px-4 py-3.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all border
                          ${selectedCategory === 'All' 
                              ? 'bg-cyan-950/30 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                              : 'bg-[#0a0a0c]/80 text-zinc-500 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-300'}
                      `}
                  >
                      All Modules
                  </button>
                  {CATEGORIES.map(cat => (
                      <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`
                              px-4 py-3.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all border whitespace-nowrap
                              ${selectedCategory === cat 
                                  ? 'bg-cyan-950/30 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                                  : 'bg-[#0a0a0c]/80 text-zinc-500 border-zinc-800/80 hover:border-zinc-700 hover:text-zinc-300'}
                          `}
                      >
                          {cat}
                      </button>
                  ))}
              </div>
            </div>
        </div>

        {/* Content Grid */}
        <section aria-label="Projects">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 size={40} className="text-cyan-500 animate-spin" />
            <p className="text-cyan-500/50 font-mono text-xs uppercase tracking-widest animate-pulse">Initializing Showcase...</p>
          </div>
        ) : filteredLinks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLinks.map((link, index) => (
              <LinkCard 
                key={link.id} 
                link={link} 
                index={index}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                isAuthenticated={!!user}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/10 backdrop-blur-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900/50 border border-zinc-800 mb-4 text-zinc-600">
                <Cpu size={24} />
            </div>
            <h3 className="text-lg font-bold text-zinc-300 font-orbitron">NO ARTIFACTS FOUND</h3>
            <p className="text-zinc-600 mt-2 font-mono text-xs">
              ADJUST QUERY PARAMETERS OR DEPLOY NEW PROJECT.
            </p>
          </div>
        )}
        </section>
        </main>
      </div>

      {/* Shared Modal */}
      <Modal 
        isOpen={!!modalType} 
        onClose={() => setModalType(null)}
        title={
          modalType === 'login' ? 'AUTHENTICATION REQUIRED' :
          editingLink ? 'MODIFY PROJECT' : 'DEPLOY NEW PROJECT'
        }
      >
        {modalType === 'login' ? (
           <LoginForm 
              onSuccess={() => setModalType(null)} 
              onCancel={() => setModalType(null)} 
           />
        ) : (
           <LinkForm 
              initialData={editingLink} 
              onSubmit={handleSave} 
              onCancel={() => setModalType(null)} 
           />
        )}
      </Modal>
    </div>
  );
};

export default App;