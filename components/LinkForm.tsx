import React, { useState, useEffect, KeyboardEvent, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import JSZip from 'jszip';
import { storage } from '../firebase';
import { LinkItem, ProjectVisibility, CategoryItem } from '../types';
import { Button } from './Button';
import { Save, X, Tag, Globe, Star, Shield, Upload, Loader, Link2, FileText, Package, FolderOpen } from 'lucide-react';

const MAX_BUNDLE_BYTES = 50 * 1024 * 1024; // 50 MB

const formatBytes = (n: number): string => {
  if (!n || n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

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
  const [bundleFile, setBundleFile] = useState<File | null>(null);
  const [bundleUrl, setBundleUrl] = useState('');
  const [bundleFileName, setBundleFileName] = useState('');
  const [bundleSize, setBundleSize] = useState(0);
  const [zipping, setZipping] = useState(false);
  const [bundleDragOver, setBundleDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mdInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

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
      setBundleFile(null);
      setBundleUrl(initialData.bundleUrl ?? '');
      setBundleFileName(initialData.bundleFileName ?? '');
      setBundleSize(initialData.bundleSize ?? 0);
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
      setBundleFile(null);
      setBundleUrl('');
      setBundleFileName('');
      setBundleSize(0);
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

  const acceptBundleFile = (file: File) => {
    const lower = file.name.toLowerCase();
    const isZipLike = lower.endsWith('.zip') ||
                      lower.endsWith('.skill') ||
                      lower.endsWith('.skills') ||
                      file.type === 'application/zip' ||
                      file.type === 'application/x-zip-compressed';
    if (!isZipLike) {
      setError('Bundle must be a .skill, .skills, or .zip file.');
      return;
    }
    if (file.size > MAX_BUNDLE_BYTES) {
      setError(`Bundle must be under ${formatBytes(MAX_BUNDLE_BYTES)}.`);
      return;
    }
    setBundleFile(file);
    setBundleFileName(file.name);
    setBundleSize(file.size);
    setBundleUrl('');
    setError('');
  };

  const handleFolderPick = async (files: FileList) => {
    if (files.length === 0) return;
    setZipping(true);
    setError('');
    try {
      const zip = new JSZip();
      const first = files[0] as File & { webkitRelativePath?: string };
      const rootName = (first.webkitRelativePath || first.name).split('/')[0] || 'skill';
      let totalIn = 0;
      for (let i = 0; i < files.length; i++) {
        const f = files[i] as File & { webkitRelativePath?: string };
        const path = f.webkitRelativePath || f.name;
        totalIn += f.size;
        zip.file(path, f);
      }
      // Quick guard before spending time zipping — the zip will be roughly this size or smaller.
      if (totalIn > MAX_BUNDLE_BYTES * 4) {
        setError(`Folder is too large (${formatBytes(totalIn)}). Limit is ${formatBytes(MAX_BUNDLE_BYTES)}.`);
        setZipping(false);
        return;
      }
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      if (blob.size > MAX_BUNDLE_BYTES) {
        setError(`Zipped folder is ${formatBytes(blob.size)} — over the ${formatBytes(MAX_BUNDLE_BYTES)} limit.`);
        setZipping(false);
        return;
      }
      const zipName = `${rootName}.zip`;
      const zipFile = new File([blob], zipName, { type: 'application/zip' });
      setBundleFile(zipFile);
      setBundleFileName(zipName);
      setBundleSize(zipFile.size);
      setBundleUrl('');
    } catch (err) {
      console.error('Folder zip failed:', err);
      setError('Could not zip that folder. Try a .zip instead.');
    } finally {
      setZipping(false);
    }
  };

  const handleBundleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setBundleDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) acceptBundleFile(file);
  };

  const clearBundle = () => {
    setBundleFile(null);
    setBundleUrl('');
    setBundleFileName('');
    setBundleSize(0);
    if (zipInputRef.current) zipInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
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

    let resolvedBundleUrl: string | undefined = bundleUrl || undefined;
    let resolvedBundleFileName: string | undefined = bundleFileName || undefined;
    let resolvedBundleSize: number | undefined = bundleSize || undefined;

    if (itemType === 'note' && bundleFile) {
      setUploading(true);
      try {
        const safeName = bundleFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `bundles/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
        const storageRef = ref(storage, path);
        // contentDisposition forces a download with the real filename — the HTML
        // `download` attribute is ignored for cross-origin Storage URLs.
        await uploadBytes(storageRef, bundleFile, {
          contentType: bundleFile.type || 'application/zip',
          contentDisposition: `attachment; filename="${bundleFile.name.replace(/["\\]/g, '')}"`,
        });
        resolvedBundleUrl = await getDownloadURL(storageRef);
        resolvedBundleFileName = bundleFile.name;
        resolvedBundleSize = bundleFile.size;
      } catch (err) {
        console.error('Bundle upload failed:', err);
        setError('Bundle upload failed. Try again or use a smaller file.');
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
        bundleUrl: resolvedBundleUrl,
        bundleFileName: resolvedBundleFileName,
        bundleSize: resolvedBundleSize,
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

      {/* Skill bundle (note mode only) */}
      {itemType === 'note' && (
        <div className="space-y-1.5">
          <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Skill Bundle <span className="normal-case font-normal text-zinc-600 ml-1">(optional folder or .zip users can download)</span>
          </label>

          {(bundleFile || bundleUrl) && !zipping && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <Package size={14} className="text-amber-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono text-amber-300 truncate">{bundleFileName || 'bundle.zip'}</div>
                <div className="text-[10px] font-mono text-zinc-500">
                  {bundleSize ? formatBytes(bundleSize) : ''}
                  {!bundleFile && bundleUrl && <span className="ml-2 text-zinc-600">· saved</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={clearBundle}
                className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
                aria-label="Remove bundle"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {zipping && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900/40">
              <Loader size={14} className="text-amber-400 animate-spin" />
              <span className="text-xs font-mono text-zinc-400">Zipping folder…</span>
            </div>
          )}

          {!bundleFile && !bundleUrl && !zipping && (
            <div
              onDragOver={e => { e.preventDefault(); setBundleDragOver(true); }}
              onDragLeave={() => setBundleDragOver(false)}
              onDrop={handleBundleDrop}
              className={`w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 py-5 px-4 transition-colors ${
                bundleDragOver
                  ? 'border-amber-500 bg-amber-950/20'
                  : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/30'
              }`}
            >
              <Package size={18} className="text-zinc-500" />
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                Drop a .skill, .skills, or .zip, or choose:
              </span>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-700 hover:border-amber-500/60 hover:text-amber-400 text-zinc-400 text-[11px] font-mono uppercase tracking-wider transition-colors"
                >
                  <FolderOpen size={11} /> Pick folder
                </button>
                <button
                  type="button"
                  onClick={() => zipInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-700 hover:border-amber-500/60 hover:text-amber-400 text-zinc-400 text-[11px] font-mono uppercase tracking-wider transition-colors"
                >
                  <Upload size={11} /> Choose file
                </button>
              </div>
              <span className="font-mono text-[9px] text-zinc-700">max {formatBytes(MAX_BUNDLE_BYTES)}</span>
            </div>
          )}

          <input
            ref={zipInputRef}
            type="file"
            accept=".skill,.skills,.zip,application/zip,application/x-zip-compressed"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) acceptBundleFile(f); }}
          />
          <input
            ref={folderInputRef}
            type="file"
            // @ts-expect-error — non-standard but widely supported
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            onChange={e => { const fs = e.target.files; if (fs && fs.length > 0) handleFolderPick(fs); }}
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
        <Button type="button" variant="ghost" onClick={onCancel} disabled={uploading || zipping}>Cancel</Button>
        <Button
          type="submit"
          variant="primary"
          icon={(uploading || zipping) ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
          disabled={uploading || zipping}
        >
          {zipping ? 'Zipping…' : uploading ? 'Uploading…' : itemType === 'note' ? 'Save Note' : 'Save Link'}
        </Button>
      </div>
    </form>
  );
};
