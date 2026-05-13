import React from 'react';
import { Edit2, Trash2, Globe, Code, Briefcase, PenTool, Lightbulb, Zap, ArrowUpRight, Tag, Eye } from 'lucide-react';
import { LinkItem, Category } from '../types';

interface LinkCardProps {
  link: LinkItem;
  index: number;
  onEdit: (link: LinkItem) => void;
  onDelete: (id: string) => void;
  onView: (link: LinkItem) => void;
  isAuthenticated: boolean;
  style?: React.CSSProperties;
}

export const getCategoryIcon = (category: Category) => {
  switch (category) {
    case 'Development': return <Code size={12} />;
    case 'Design': return <PenTool size={12} />;
    case 'Marketing': return <Globe size={12} />;
    case 'Operations': return <Briefcase size={12} />;
    case 'Inspiration': return <Lightbulb size={12} />;
    default: return <Zap size={12} />;
  }
};

export const getCategoryColor = (category: Category) => {
  switch (category) {
    case 'Development': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    case 'Design': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
    case 'Marketing': return 'text-green-400 border-green-500/30 bg-green-500/10';
    case 'Operations': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
    case 'Inspiration': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    default: return 'text-zinc-400 border-zinc-700 bg-zinc-800';
  }
};

export const LinkCard: React.FC<LinkCardProps> = ({ link, index, onEdit, onDelete, onView, isAuthenticated, style }) => {
  const formattedIndex = (index + 1).toString().padStart(2, '0');
  const hostname = (() => {
    try {
      return new URL(link.url).hostname.replace(/^www\./, '');
    } catch {
      return link.url;
    }
  })();

  return (
    <div
      className="panel-surface group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.5rem] border border-white/8 bg-radial-panel transition-all duration-300 hover:-translate-y-1 hover:border-sky-300/28 hover:shadow-[0_24px_70px_rgba(14,165,233,0.14)] motion-reduce:transform-none motion-reduce:transition-none animate-fade-in-up"
      style={style}
      onClick={() => onView(link)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onView(link)}
      aria-label={`View details for ${link.title}`}
    >
      {/* Decorative Top Bar */}
      <div className="pulse-line absolute left-5 right-5 top-4 h-px bg-gradient-to-r from-transparent via-sky-300/45 to-transparent motion-reduce:animate-none" />

      {/* Thumbnail */}
      {link.imageUrl && (
        <div className="relative h-44 overflow-hidden flex-shrink-0">
          <img
            src={link.imageUrl}
            alt={link.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08101f] via-transparent to-transparent" />
        </div>
      )}

      <div className="flex h-full flex-col p-6">
        {/* Header Row */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-slate-500 transition-colors group-hover:text-sky-300/80">#{formattedIndex}</span>
              <div className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(link.category)}`}>
                {getCategoryIcon(link.category)}
                <span>{link.category}</span>
              </div>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">{hostname}</p>
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-1 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(link); }}
                aria-label={`Edit ${link.title}`}
                className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-sky-400/10 hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(link.id); }}
                aria-label={`Delete ${link.title}`}
                className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="mb-5 flex-grow">
          <h3 className="mb-3 font-orbitron text-2xl font-bold leading-tight tracking-tight text-white transition-colors group-hover:text-sky-100">
            {link.title}
          </h3>
          <p className="line-clamp-3 border-l-2 border-white/8 pl-4 text-sm leading-7 text-slate-400 transition-colors group-hover:border-sky-300/25 group-hover:text-slate-300">
            {link.description}
          </p>
        </div>

        {link.tags && link.tags.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {link.tags.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[10px] font-mono text-slate-400"
              >
                <Tag size={8} className="text-sky-300" />
                {tag}
              </span>
            ))}
            {link.tags.length > 4 && (
              <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[10px] font-mono text-slate-500">
                +{link.tags.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-white/8 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.65)]" />
              Live
            </div>
            {isAuthenticated && link.viewCount !== undefined && link.viewCount > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                <Eye size={10} />
                {link.viewCount.toLocaleString()}
              </div>
            )}
          </div>

          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-100 transition-all duration-200 hover:border-sky-300/35 hover:bg-sky-400/10 hover:text-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 motion-reduce:transition-none"
          >
            View
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};
