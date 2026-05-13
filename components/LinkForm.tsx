import React, { useState, useEffect, KeyboardEvent } from 'react';
import { LinkItem, ProjectVisibility, CategoryItem } from '../types';
import { Select } from './Input';
import { Button } from './Button';
import { Save, X, Tag, Globe, Star, Shield } from 'lucide-react';

interface LinkFormProps {
  initialData?: LinkItem | null;
  categories: CategoryItem[];
  onSubmit: (data: Omit<LinkItem, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const VISIBILITY_OPTIONS: { value: ProjectVisibility; label: string; desc: string; Icon: React.FC<{size?:number}> }[] = [
  { value: 'public', label: 'Public',     desc: 'Anyone can see this',         Icon: ({ size }) => <Globe size={size} /> },
  { value: 'vip',    label: 'VIP',        desc: 'Logged-in VIP+ users only',   Icon: ({ size }) => <Star size={size} /> },
  { value: 'admin',  label: 'Admin only', desc: 'Only visible to you',         Icon: ({ size }) => <Shield size={size} /> },
];

export const LinkForm: React.FC<LinkFormProps> = ({ initialData, categories, onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState<ProjectVisibility>('public');
  const [imageUrl, setImageUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Default category to first available
  useEffect(() => {
    if (!category && categories.length > 0) {
      setCategory(categories[0].name);
    }
  }, [categories, category]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setUrl(initialData.url);
      setDescription(initialData.description);
      setCategory(initialData.category);
      setVisibility(initialData.visibility ?? 'public');
      setImageUrl(initialData.imageUrl ?? '');
      setTags(initialData.tags ?? []);
    } else {
      setTitle('');
      setUrl('');
      setDescription('');
      setCategory(categories[0]?.name ?? '');
      setVisibility('public');
      setImageUrl('');
      setTagInput('');
      setTags([]);
    }
  }, [initialData]);

  const addTag = (raw: string) => {
    const trimmed = raw.trim().toLowerCase().replace(/\s+/g, '-');
    if (trimmed && !tags.includes(trimmed) && tags.length < 8) {
      setTags(prev => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
    else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !url.trim()) { setError('Title and URL are required.'); return; }
    try { new URL(url); } catch { setError('Please enter a valid URL (e.g., https://example.com)'); return; }
    if (imageUrl.trim()) {
      try { new URL(imageUrl); } catch { setError('Please enter a valid image URL or leave it blank.'); return; }
    }

    const finalTags = [...tags];
    if (tagInput.trim()) {
      const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
      if (t && !finalTags.includes(t)) finalTags.push(t);
    }

    onSubmit({
      title: title.trim(),
      url: url.trim(),
      description: description.trim(),
      category,
      visibility,
      tags: finalTags,
      imageUrl: imageUrl.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">Title</label>
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Design System"
          autoFocus
          className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors outline-none text-sm"
        />
      </div>

      {/* URL */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">URL</label>
        <input
          value={url} onChange={e => { setUrl(e.target.value); setError(''); }}
          placeholder="https://..."
          className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors outline-none text-sm"
        />
        {error && <p className="text-red-400 text-xs font-mono mt-1">{error}</p>}
      </div>

      {/* Category + Visibility row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">Section</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors outline-none text-sm appearance-none"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">Visibility</label>
          <select
            value={visibility}
            onChange={e => setVisibility(e.target.value as ProjectVisibility)}
            className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors outline-none text-sm appearance-none"
          >
            {VISIBILITY_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Visibility hint */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/30 border border-zinc-800">
        {(() => {
          const opt = VISIBILITY_OPTIONS.find(o => o.value === visibility)!;
          return <>
            <opt.Icon size={12} /><span className="font-mono text-[10px] text-zinc-500">{opt.desc}</span>
          </>;
        })()}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">Description</label>
        <textarea
          className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors outline-none resize-none h-24 text-sm"
          placeholder="What is this link for?"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
          Tags <span className="normal-case font-normal text-zinc-600 ml-1">(Enter or comma to add)</span>
        </label>
        <div
          className="flex flex-wrap gap-1.5 min-h-[42px] w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-colors cursor-text"
          onClick={() => document.getElementById('tag-input')?.focus()}
        >
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded-full bg-cyan-950/50 text-cyan-400 border border-cyan-800/50">
              <Tag size={9} />
              {tag}
              <button type="button" onClick={e => { e.stopPropagation(); removeTag(tag); }} className="ml-0.5 text-cyan-600 hover:text-cyan-300 transition-colors" aria-label={`Remove tag ${tag}`}>
                <X size={10} />
              </button>
            </span>
          ))}
          <input
            id="tag-input" type="text" value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => tagInput.trim() && addTag(tagInput)}
            placeholder={tags.length === 0 ? 'react, typescript, firebase…' : ''}
            className="flex-1 min-w-[120px] bg-transparent text-zinc-100 placeholder-zinc-600 text-sm outline-none"
            maxLength={30}
          />
        </div>
      </div>

      {/* Thumbnail */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">Thumbnail URL (optional)</label>
        <input
          value={imageUrl} onChange={e => { setImageUrl(e.target.value); setError(''); }}
          placeholder="https://i.imgur.com/... or any image URL"
          className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors outline-none text-sm"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-6">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" icon={<Save size={16} />}>Save Link</Button>
      </div>
    </form>
  );
};
