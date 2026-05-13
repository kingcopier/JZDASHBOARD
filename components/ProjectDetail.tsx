import React from 'react';
import { ArrowUpRight, Eye, Tag, X } from 'lucide-react';
import { LinkItem, Category } from '../types';
import { getCategoryColor, getCategoryIcon } from './LinkCard';

interface ProjectDetailProps {
  link: LinkItem | null;
  onClose: () => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ link, onClose }) => {
  if (!link) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">

        {/* Thumbnail */}
        {link.imageUrl ? (
          <div className="relative h-56 overflow-hidden">
            <img
              src={link.imageUrl}
              alt={link.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
          </div>
        ) : (
          <div className="h-3 bg-gradient-to-r from-cyan-500/40 via-purple-500/40 to-blue-500/40" />
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900/80 border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors backdrop-blur-sm"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Category badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md border text-[10px] uppercase font-bold tracking-wider ${getCategoryColor(link.category)}`}>
              {getCategoryIcon(link.category)}
              <span>{link.category}</span>
            </div>
            {link.viewCount !== undefined && link.viewCount > 0 && (
              <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-mono">
                <Eye size={12} />
                <span>{link.viewCount.toLocaleString()} views</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-3xl font-black text-zinc-100 font-orbitron tracking-wide uppercase leading-tight mb-4">
            {link.title}
          </h2>

          {/* Description */}
          <p className="text-zinc-300 leading-relaxed text-base font-light mb-6 border-l-2 border-cyan-500/30 pl-4">
            {link.description || 'No description provided.'}
          </p>

          {/* Tags */}
          {link.tags && link.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {link.tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700"
                >
                  <Tag size={10} className="text-cyan-500" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Visit button */}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
          >
            Visit Project <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};
