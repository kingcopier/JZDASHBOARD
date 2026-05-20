import React, { useState, useEffect, KeyboardEvent, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { LinkItem, ProjectVisibility, CategoryItem } from '../types';
import { Button } from './Button';
import { Save, X, Tag, Globe, Star, Shield, Upload, Loader, Link2, FileText } from 'lucide-react';

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
  const [itemType, setItemType] = useState<'link' | 'note'>('link');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState<ProjectVisibility>('public');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mdInputRef = useRef<HTMLInputElement>(null);

  // Default category to first available
  useEffect(() => {
    if (!category && categories.length > 0) {
      setCategory(categories[0].name);
    }
  }, [categories, category]);

  useEffect(() => {
    if (initialData) {
      setItemType(initialData.type === 'note' ? 'note' : 'link');
      setTitle(initialData.title);
      setUrl(initialData.url);
      setDescription(initialData.description);
      setContent(initialData.content ?? '');
      setFileName(initialData.fileName ?? '');
      setCategory(initialData.category);
      setVisibility(initialData.visibility ?? 'public');
      setImageUrl(initialData.imageUrl ?? '');
      setImagePreview(initialData.imageUrl ?? '');
      setTags(initialData.tags ?? []);
      setImageFile(null);
    } else {
      setItemType('link');
      setTitle('');
      setUrl('');
      setDescription('');
      setContent('');
      setFileName('');
      setCategory(categories[0]?.name ?? '');
      setVisibility('public');
      setImageUrl('');
      setImageFile(null);
      setImagePreview('');
      setTagInput('');
      setTags([]);
    }
  }, [initialData]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }
    setImageFile(file);
    setImageUrl('');
    setError('');
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

  const handleMdFileSelect = (file: File) => {
    if (!file.name.endsWith('.md') && !file.type.includes('text')) {
      setError('Please select a .md or text file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      setContent(e.target?.result as string ?? '');
      setFileName(file.name);
      setError('');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('Title is required.'); return; }

    if (itemType === 'link') {
      if (!url.trim()) { setError('URL is required.'); return; }
      try { new URL(url); } catch { setError('Please enter a valid URL (e.g., https://example.com)'); return; }
    } else {
      if (!content.trim()) { setError('Content is required.'); return; }
    }

    if (imageUrl.trim()) {
      try { new URL(imageUrl); } catch { setError('Please enter a valid image URL or leave it blank.'); return; }
    }

    const finalTags = [...tags];
    if (tagInput.trim()) {
      const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
      if (t && !finalTags.includes(t)) finalTags.push(t);
    }

    let resolvedImageUrl: string | undefined = imageUrl.trim() || undefined;

    if (imageFile) {
      setUploading(true);
      try {
        const ext = imageFile.name.split('.').pop() ?? 'jpg';
        const path = `thumbnails/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, imageFile);
        resolvedImageUrl = await getDownloadURL(storageRef);
      } catch (err) {
        console.error('Upload failed:', err);
        setError('Image upload failed. Try a URL instead.');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    if (itemType === 'note') {
      onSubmit({
        title: title.trim(),
        url: '',
        description: description.trim(),
        category,
        visibility,
        tags: finalTags,
        imageUrl: resolvedImageUrl,
        type: 'note',
        content: content,
        fileName: fileName || undefined,
      });
    } else {
      onSubmit({
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
        category,
        visibility,
        tags: finalTags,
        imageUrl: resolvedImageUrl,
        type: 'link',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
        <button
          type="button"
          onClick={() => { setItemType('link'); setError(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
            itemType === 'link'
              ? 'bg-cyan-950/40 text-cyan-400 border-r border-zinc-700'
              : 'bg-zinc-900/30 text-zinc-500 border-r border-zinc-700 hover:text-zinc-300'
          }`}
        >
          <Link2 size={13} /> Link
        </button>
        <button
          type="button"
          onClick={() => { setItemType('note'); setError(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
            itemType === 'note'
              ? 'bg-amber-950/40 text-amber-400'
              : 'bg-zinc-900/30 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <FileText size={13} /> Note
        </button>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">Title</label>
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder={itemType === 'note' ? 'e.g. Claude Agent Skills' : 'e.g. Design System'}
          autoFocus
          className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors outline-none text-sm"
        />
      </div>

      {/* URL (link mode only) */}
      {itemType === 'link' && (
        <div className="space-y-1.5">
          <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">URL</label>
          <input
            value={url} onChange={e => { setUrl(e.target.value); setError(''); }}
            placeholder="https://..."
            className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors outline-none text-sm"
          />
          {error && <p className="text-red-400 text-xs font-mono mt-1">{error}</p>}
        </div>
      )}

      {/* Content (note mode only) */}
      {itemType === 'note' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Content <span className="normal-case font-normal text-zinc-600 ml-1">(Markdown)</span>
            </label>
            <button
              type="button"
              onClick={() => mdInputRef.current?.click()}
              className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 hover:text-amber-400 transition-colors uppercase tracking-wider"
            >
              <Upload size={10} /> Upload .md
            </button>
          </div>
          <textarea
            value={content}
            onChange={e => { setContent(e.target.value); setError(''); }}
            placeholder={'# Skills\n\n## Prompt Engineering\n- Chain of thought\n- Few-shot examples\n...'}
            className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 transition-colors outline-none resize-y h-48 text-sm font-mono"
          />
          {fileName && (
            <p className="text-[10px] font-mono text-amber-400/70 flex items-center gap-1">
              <FileText size={10} /> {fileName}
            </p>
          )}
          {error && <p className="text-red-400 text-xs font-mono mt-1">{error}</p>}
          <input
            ref={mdInputRef}
            type="file"
            accept=".md,.txt,text/plain,text/markdown"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleMdFileSelect(f); }}
          />
        </div>
      )}

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

      {/* Thumbnail — upload or URL */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">Thumbnail</label>

        {/* Preview */}
        {imagePreview && (
          <div className="relative group w-full h-36 rounded-lg overflow-hidden border border-zinc-700">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-zinc-300 hover:text-white hover:bg-black transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
            {imageFile && (
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 font-mono text-[9px] text-zinc-400">
                {imageFile.name}
              </div>
            )}
          </div>
        )}

        {/* Drop zone — only show when no preview */}
        {!imagePreview && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              dragOver
                ? 'border-cyan-500 bg-cyan-950/20'
                : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/30'
            }`}
          >
            <Upload size={16} className="text-zinc-500" />
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
              Drop image or click to upload
            </span>
            <span className="font-mono text-[9px] text-zinc-700">PNG, JPG, WebP · max 5MB</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
        />

        {/* Divider */}
        {!imagePreview && (
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="font-mono text-[9px] text-zinc-700 uppercase tracking-wider">or paste a URL</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>
        )}

        {/* URL fallback — hidden when a file is selected */}
        {!imageFile && (
          <input
            value={imageUrl}
            onChange={e => { setImageUrl(e.target.value); setError(''); setImagePreview(e.target.value); }}
            placeholder="https://i.imgur.com/... or any image URL"
            className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors outline-none text-sm"
          />
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-6">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={uploading}>Cancel</Button>
        <Button
          type="submit"
          variant="primary"
          icon={uploading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : itemType === 'note' ? 'Save Note' : 'Save Link'}
        </Button>
      </div>
    </form>
  );
};
