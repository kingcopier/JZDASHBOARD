import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, deleteDoc, doc, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { TagItem } from '../../types';
import { Plus, Trash2, Tag } from 'lucide-react';

export const TagsTab: React.FC = () => {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'tags'), orderBy('count', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setTags(snap.docs.map(d => ({ id: d.id, ...d.data() } as TagItem)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const addTag = async () => {
    const name = newTag.trim().toLowerCase().replace(/\s+/g, '-');
    if (!name) return;
    if (tags.some(t => t.name === name)) {
      setNewTag('');
      return;
    }
    setAdding(true);
    try {
      await addDoc(collection(db, 'tags'), { name, count: 0, createdAt: Date.now() });
      setNewTag('');
    } finally {
      setAdding(false);
    }
  };

  const deleteTag = async (id: string, name: string) => {
    if (!window.confirm(`Delete tag "${name}"? It will remain on any projects that already use it.`)) return;
    await deleteDoc(doc(db, 'tags', id));
  };

  if (loading) return (
    <div className="py-16 text-center font-mono text-xs text-zinc-600 animate-pulse">
      LOADING TAGS...
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="flex gap-3">
        <input
          type="text"
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTag()}
          placeholder="New tag (e.g. react, firebase)..."
          className="flex-1 bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors outline-none font-mono text-sm"
        />
        <button
          onClick={addTag}
          disabled={adding || !newTag.trim()}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-40"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Tag cloud */}
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <div
            key={tag.id}
            className="group flex items-center gap-2 pl-3 pr-1.5 py-1.5 bg-[#0a0a0c] border border-zinc-800 rounded-full hover:border-zinc-600 transition-colors"
          >
            <Tag size={10} className="text-cyan-600 flex-shrink-0" />
            <span className="font-mono text-xs text-zinc-300">{tag.name}</span>
            {tag.count > 0 && (
              <span className="font-mono text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded-full">
                {tag.count}
              </span>
            )}
            <button
              onClick={() => deleteTag(tag.id, tag.name)}
              aria-label={`Delete tag ${tag.name}`}
              className="p-1 text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 rounded-full"
            >
              <Trash2 size={10} />
            </button>
          </div>
        ))}
      </div>

      {tags.length === 0 && (
        <div className="py-16 text-center border border-dashed border-zinc-800 rounded-xl">
          <Tag size={24} className="text-zinc-700 mx-auto mb-3" />
          <p className="font-mono text-xs text-zinc-600">NO TAGS YET. ADD SOME ABOVE.</p>
          <p className="font-mono text-[10px] text-zinc-700 mt-1">
            Tags are also auto-created when you add them to a project.
          </p>
        </div>
      )}
    </div>
  );
};
