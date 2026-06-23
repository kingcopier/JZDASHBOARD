import React, { useState, useEffect, KeyboardEvent, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import JSZip from 'jszip';
import { storage } from '../firebase';
import { SkillItem, ProjectVisibility, CategoryItem } from '../types';
import { parseSkillBundle } from '../lib/parseSkill';
import { Button } from './Button';
import { Save, X, Tag, Globe, Star, Shield, Upload, Loader, Package, FolderOpen, Sparkles } from 'lucide-react';

const MAX_BUNDLE_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_README_CHARS = 100_000;          // matches firestore.rules cap

const formatBytes = (n: number): string => {
  if (!n || n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

interface SkillFormProps {
  initialData?: SkillItem | null;
  categories: CategoryItem[];
  onSubmit: (data: Omit<SkillItem, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const VISIBILITY_OPTIONS: { value: ProjectVisibility; label: string; desc: string; Icon: React.FC<{ size?: number }> }[] = [
  { value: 'public', label: 'Public',     desc: 'Anyone can download this',    Icon: ({ size }) => <Globe size={size} /> },
  { value: 'vip',    label: 'VIP',        desc: 'Logged-in VIP+ users only',   Icon: ({ size }) => <Star size={size} /> },
  { value: 'admin',  label: 'Admin only', desc: 'Only visible to you',         Icon: ({ size }) => <Shield size={size} /> },
];

export const SkillForm: React.FC<SkillFormProps> = ({ initialData, categories, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [readme, setReadme] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState<ProjectVisibility>('public');
  const [imageUrl, setImageUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const [bundleFile, setBundleFile] = useState<File | null>(null);
  const [bundleUrl, setBundleUrl] = useState('');
  const [bundleFileName, setBundleFileName] = useState('');
  const [bundleSize, setBundleSize] = useState(0);

  const [zipping, setZipping] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedNote, setParsedNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [bundleDragOver, setBundleDragOver] = useState(false);
  const [error, setError] = useState('');

  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!category && categories.length > 0) setCategory(categories[0].name);
  }, [categories, category]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description ?? '');
      setReadme(initialData.readme ?? '');
      setCategory(initialData.category);
      setVisibility(initialData.visibility ?? 'public');
      setImageUrl(initialData.imageUrl ?? '');
      setTags(initialData.tags ?? []);
      setBundleFile(null);
      setBundleUrl(initialData.bundleUrl ?? '');
      setBundleFileName(initialData.bundleFileName ?? '');
      setBundleSize(initialData.bundleSize ?? 0);
      setParsedNote('');
    } else {
      setName('');
      setDescription('');
      setReadme('');
      setCategory(categories[0]?.name ?? '');
      setVisibility('public');
      setImageUrl('');
      setTagInput('');
      setTags([]);
      setBundleFile(null);
      setBundleUrl('');
      setBundleFileName('');
      setBundleSize(0);
      setParsedNote('');
    }
  }, [initialData]);

  /** Pull name/description/readme out of a freshly selected bundle, filling only blanks. */
  const autofillFromBundle = async (file: File) => {
    setParsing(true);
    setParsedNote('');
    try {
      const parsed = await parseSkillBundle(file);
      if (!parsed) {
        setParsedNote('No SKILL.md found — fill in the details manually.');
        return;
      }
      let filled = false;
      if (parsed.name) { setName(prev => prev.trim() ? prev : parsed.name!); filled = true; }
      if (parsed.description) { setDescription(prev => prev.trim() ? prev : parsed.description!); filled = true; }
      if (parsed.body) {
        const body = parsed.body.slice(0, MAX_README_CHARS);
        setReadme(prev => prev.trim() ? prev : body);
        filled = true;
      }
      setParsedNote(filled ? 'Auto-filled from SKILL.md ✓' : 'SKILL.md had no name or description.');
    } catch (err) {
      console.error('Skill parse failed:', err);
      setParsedNote('Could not read SKILL.md — fill in the details manually.');
    } finally {
      setParsing(false);
    }
  };

  const acceptBundleFile = (file: File) => {
    const lower = file.name.toLowerCase();
    const isZipLike = lower.endsWith('.skill') ||
                      lower.endsWith('.skills') ||
                      lower.endsWith('.zip') ||
                      file.type === 'application/zip' ||
                      file.type === 'application/x-zip-compressed';
    if (!isZipLike) {
      setError('Skill must be a .skill, .skills, or .zip file.');
      return;
    }
    if (file.size > MAX_BUNDLE_BYTES) {
      setError(`Skill must be under ${formatBytes(MAX_BUNDLE_BYTES)}.`);
      return;
    }
    setBundleFile(file);
    setBundleFileName(file.name);
    setBundleSize(file.size);
    setBundleUrl('');
    setError('');
    void autofillFromBundle(file);
  };

  /** Zip a picked folder into a `<root>.skill` so a raw skill folder can be uploaded directly. */
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
      const skillName = `${rootName}.skill`;
      const skillFile = new File([blob], skillName, { type: 'application/zip' });
      setBundleFile(skillFile);
      setBundleFileName(skillName);
      setBundleSize(skillFile.size);
      setBundleUrl('');
      void autofillFromBundle(skillFile);
    } catch (err) {
      console.error('Folder zip failed:', err);
      setError('Could not zip that folder. Try a .skill or .zip instead.');
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
    setParsedNote('');
    if (zipInputRef.current) zipInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const addTag = (raw: string) => {
    const trimmed = raw.trim().toLowerCase().replace(/\s+/g, '-');
    if (trimmed && !tags.includes(trimmed) && tags.length < 8) setTags(prev => [...prev, trimmed]);
    setTagInput('');
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
    else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) setTags(prev => prev.slice(0, -1));
  };

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Name is required.'); return; }
    if (!bundleFile && !bundleUrl) { setError('A .skill file is required.'); return; }
    if (imageUrl.trim()) {
      try { new URL(imageUrl); } catch { setError('Please enter a valid image URL or leave it blank.'); return; }
    }

    const finalTags = [...tags];
    if (tagInput.trim()) {
      const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
      if (t && !finalTags.includes(t)) finalTags.push(t);
    }

    let resolvedBundleUrl = bundleUrl;
    let resolvedBundleFileName = bundleFileName;
    let resolvedBundleSize = bundleSize;

    if (bundleFile) {
      setUploading(true);
      try {
        const safeName = bundleFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `bundles/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
        const storageRef = ref(storage, path);
        // contentDisposition forces the browser to download with the real filename.
        // The HTML `download` attribute is ignored for cross-origin Storage URLs, so
        // the server header is what makes "big-bird.skill" come down instead of a UUID.
        await uploadBytes(storageRef, bundleFile, {
          contentType: bundleFile.type || 'application/zip',
          contentDisposition: `attachment; filename="${bundleFile.name.replace(/["\\]/g, '')}"`,
        });
        resolvedBundleUrl = await getDownloadURL(storageRef);
        resolvedBundleFileName = bundleFile.name;
        resolvedBundleSize = bundleFile.size;
      } catch (err) {
        console.error('Skill upload failed:', err);
        setError('Upload failed. Try again or use a smaller file.');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      readme: readme.trim() ? readme.slice(0, MAX_README_CHARS) : undefined,
      category,
      visibility,
      tags: finalTags,
      imageUrl: imageUrl.trim() || undefined,
      bundleUrl: resolvedBundleUrl,
      bundleFileName: resolvedBundleFileName,
      bundleSize: resolvedBundleSize || undefined,
    });
  };

  const busy = uploading || zipping || parsing;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Skill file (required) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
          Skill File <span className="normal-case font-normal text-zinc-600 ml-1">(.skill, .skills, .zip, or a folder)</span>
        </label>

        {(bundleFile || bundleUrl) && !zipping && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5">
            <Package size={14} className="text-amber-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono text-amber-300 truncate">{bundleFileName || 'skill'}</div>
              <div className="text-[10px] font-mono text-zinc-500">
                {bundleSize ? formatBytes(bundleSize) : ''}
                {!bundleFile && bundleUrl && <span className="ml-2 text-zinc-600">· saved</span>}
              </div>
            </div>
            <button type="button" onClick={clearBundle} className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition-colors" aria-label="Remove skill">
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
              bundleDragOver ? 'border-amber-500 bg-amber-950/20' : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900/30'
            }`}
          >
            <Package size={18} className="text-zinc-500" />
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">Drop a .skill, or choose:</span>
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

        {(parsing || parsedNote) && (
          <p className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400/80">
            {parsing ? <Loader size={10} className="animate-spin" /> : <Sparkles size={10} />}
            {parsing ? 'Reading SKILL.md…' : parsedNote}
          </p>
        )}
        {error && <p className="text-red-400 text-xs font-mono mt-1">{error}</p>}

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

      {/* Name */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">Name</label>
        <input
          value={name} onChange={e => { setName(e.target.value); setError(''); }}
          placeholder="e.g. big-bird"
          className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 transition-colors outline-none text-sm font-mono"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">Description</label>
        <textarea
          className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 transition-colors outline-none resize-none h-24 text-sm"
          placeholder="What does this skill do, and when should it be used?"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      {/* Category + Visibility */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">Section</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 transition-colors outline-none text-sm appearance-none"
          >
            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">Visibility</label>
          <select
            value={visibility}
            onChange={e => setVisibility(e.target.value as ProjectVisibility)}
            className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 transition-colors outline-none text-sm appearance-none"
          >
            {VISIBILITY_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/30 border border-zinc-800">
        {(() => {
          const opt = VISIBILITY_OPTIONS.find(o => o.value === visibility)!;
          return <><opt.Icon size={12} /><span className="font-mono text-[10px] text-zinc-500">{opt.desc}</span></>;
        })()}
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
          Tags <span className="normal-case font-normal text-zinc-600 ml-1">(Enter or comma to add)</span>
        </label>
        <div
          className="flex flex-wrap gap-1.5 min-h-[42px] w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2 focus-within:border-amber-500/70 focus-within:ring-1 focus-within:ring-amber-500/30 transition-colors cursor-text"
          onClick={() => document.getElementById('skill-tag-input')?.focus()}
        >
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded-full bg-amber-950/50 text-amber-400 border border-amber-800/50">
              <Tag size={9} />
              {tag}
              <button type="button" onClick={e => { e.stopPropagation(); removeTag(tag); }} className="ml-0.5 text-amber-600 hover:text-amber-300 transition-colors" aria-label={`Remove tag ${tag}`}>
                <X size={10} />
              </button>
            </span>
          ))}
          <input
            id="skill-tag-input" type="text" value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => tagInput.trim() && addTag(tagInput)}
            placeholder={tags.length === 0 ? 'youtube, seo, copywriting…' : ''}
            className="flex-1 min-w-[120px] bg-transparent text-zinc-100 placeholder-zinc-600 text-sm outline-none"
            maxLength={30}
          />
        </div>
      </div>

      {/* Thumbnail (URL only) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
          Thumbnail <span className="normal-case font-normal text-zinc-600 ml-1">(optional image URL)</span>
        </label>
        <input
          value={imageUrl}
          onChange={e => { setImageUrl(e.target.value); setError(''); }}
          placeholder="https://i.imgur.com/... or any image URL"
          className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 transition-colors outline-none text-sm"
        />
        {imageUrl.trim() && (
          <div className="w-full h-36 rounded-lg overflow-hidden border border-zinc-700">
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2'; }} />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-6">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button
          type="submit"
          variant="primary"
          icon={busy ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
          disabled={busy}
        >
          {zipping ? 'Zipping…' : parsing ? 'Reading…' : uploading ? 'Uploading…' : 'Save Skill'}
        </Button>
      </div>
    </form>
  );
};
