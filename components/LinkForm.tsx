import React, { useState, useEffect } from 'react';
import { LinkItem, CATEGORIES, Category } from '../types';
import { Input, Select } from './Input';
import { Button } from './Button';
import { Save } from 'lucide-react';

interface LinkFormProps {
  initialData?: LinkItem | null;
  onSubmit: (data: Omit<LinkItem, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export const LinkForm: React.FC<LinkFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Development');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setUrl(initialData.url);
      setDescription(initialData.description);
      setCategory(initialData.category);
    } else {
        // Reset if no initial data
        setTitle('');
        setUrl('');
        setDescription('');
        setCategory('Development');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      setError('Title and URL are required.');
      return;
    }

    try {
        new URL(url); // Simple validation
    } catch (_) {
        setError('Please enter a valid URL (e.g., https://example.com)');
        return;
    }

    onSubmit({ title, url, description, category });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input 
        label="Title" 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
        placeholder="e.g. Design System" 
        autoFocus
      />
      
      <Input 
        label="URL" 
        value={url} 
        onChange={(e) => setUrl(e.target.value)} 
        placeholder="https://..." 
        error={error}
      />

      <Select 
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value as Category)}
      >
        {CATEGORIES.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </Select>

      <div className="space-y-1.5">
        <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Description
        </label>
        <textarea
            className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors duration-200 outline-none resize-none h-24"
            placeholder="What is this link for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800 mt-6">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" icon={<Save size={16} />}>
          Save Link
        </Button>
      </div>
    </form>
  );
};