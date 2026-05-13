import React, { useEffect, useState } from 'react';
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, writeBatch, getDocs
} from 'firebase/firestore';
import { db } from '../../firebase';
import { CategoryItem, DEFAULT_CATEGORIES } from '../../types';
import { Plus, Trash2, GripVertical } from 'lucide-react';

export const SectionsTab: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, async snap => {
      const cats = snap.docs.map(d => ({ id: d.id, ...d.data() } as CategoryItem));
      setCategories(cats);
      setLoading(false);

      // One-time seed if collection is empty
      if (cats.length === 0 && !seeded) {
        setSeeded(true);
        const batch = writeBatch(db);
        DEFAULT_CATEGORIES.forEach((name, i) => {
          const ref = doc(collection(db, 'categories'));
          batch.set(ref, { name, order: i, createdAt: Date.now() });
        });
        await batch.commit();
      }
    });
    return unsub;
  }, [seeded]);

  const addSection = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      await addDoc(collection(db, 'categories'), {
        name,
        order: categories.length,
        createdAt: Date.now(),
      });
      setNewName('');
    } finally {
      setAdding(false);
    }
  };

  const deleteSection = async (id: string, name: string) => {
    // Check if any links use this category
    const snap = await getDocs(collection(db, 'links'));
    const using = snap.docs.filter(d => d.data().category === name).length;
    if (using > 0) {
      if (!window.confirm(`${using} project(s) use the "${name}" section. Delete anyway? They'll keep the value but it won't appear as a filter.`)) return;
    } else {
      if (!window.confirm(`Delete section "${name}"?`)) return;
    }
    await deleteDoc(doc(db, 'categories', id));
  };

  if (loading) return (
    <div className="py-16 text-center font-mono text-xs text-zinc-600 animate-pulse">
      LOADING SECTIONS...
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addSection()}
          placeholder="New section name..."
          className="flex-1 bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors outline-none font-mono text-sm"
        />
        <button
          onClick={addSection}
          disabled={adding || !newName.trim()}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-40"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {categories.map((cat, idx) => (
          <div
            key={cat.id}
            className="flex items-center gap-3 px-4 py-3 bg-[#0a0a0c] border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors group"
          >
            <GripVertical size={14} className="text-zinc-700 flex-shrink-0" />
            <span className="flex-1 font-mono text-sm text-zinc-300">{cat.name}</span>
            <span className="font-mono text-[10px] text-zinc-700">#{idx + 1}</span>
            <button
              onClick={() => deleteSection(cat.id, cat.name)}
              aria-label={`Delete section ${cat.name}`}
              className="p-1.5 text-zinc-700 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {categories.length === 0 && !loading && (
        <div className="py-16 text-center">
          <p className="font-mono text-xs text-zinc-600">NO SECTIONS. SEEDING...</p>
        </div>
      )}
    </div>
  );
};
