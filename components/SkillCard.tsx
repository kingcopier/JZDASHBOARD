import React from 'react';
import { Edit2, Trash2, Tag, Download, Package, Globe, Star, Shield } from 'lucide-react';
import { SkillItem } from '../types';
import { getCategoryColor, getCategoryIcon } from './LinkCard';

interface SkillCardProps {
  skill: SkillItem;
  index: number;
  onView: (skill: SkillItem) => void;
  onEdit: (skill: SkillItem) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
  style?: React.CSSProperties;
}

const formatBytes = (n?: number): string => {
  if (!n || n < 1024) return n ? `${n} B` : '';
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const visibilityIcon = (v: SkillItem['visibility']) => {
  if (v === 'vip') return <Star size={9} />;
  if (v === 'admin') return <Shield size={9} />;
  return <Globe size={9} />;
};

export const SkillCard: React.FC<SkillCardProps> = ({ skill, index, onView, onEdit, onDelete, isAdmin, style }) => {
  const formattedIndex = (index + 1).toString().padStart(2, '0');

  return (
    <div
      className="panel-surface group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.5rem] border border-white/8 bg-radial-panel transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/28 hover:shadow-[0_24px_70px_rgba(251,191,36,0.12)] motion-reduce:transform-none motion-reduce:transition-none animate-fade-in-up"
      style={style}
      onClick={() => onView(skill)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onView(skill)}
      aria-label={`View details for ${skill.name}`}
    >
      <div className="pulse-line absolute left-5 right-5 top-4 h-px bg-gradient-to-r from-transparent via-amber-300/45 to-transparent motion-reduce:animate-none" />

      {skill.imageUrl && (
        <div className="relative h-44 overflow-hidden flex-shrink-0">
          <img
            src={skill.imageUrl}
            alt={skill.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08101f] via-transparent to-transparent" />
        </div>
      )}

      <div className="flex h-full flex-col p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-slate-500 transition-colors group-hover:text-amber-300/80">#{formattedIndex}</span>
              <div className={`flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getCategoryColor(skill.category)}`}>
                {getCategoryIcon(skill.category)}
                <span>{skill.category}</span>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.04] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  {visibilityIcon(skill.visibility)}
                  {skill.visibility}
                </div>
              )}
            </div>
            <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.28em] text-amber-500/80">
              <Package size={10} /> {skill.bundleFileName}
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(skill); }}
                aria-label={`Edit ${skill.name}`}
                className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-amber-400/10 hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(skill.id); }}
                aria-label={`Delete ${skill.name}`}
                className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="mb-5 flex-grow">
          <h3 className="mb-3 font-orbitron text-2xl font-bold leading-tight tracking-tight text-white transition-colors group-hover:text-amber-100">
            {skill.name}
          </h3>
          <p className="line-clamp-3 border-l-2 border-white/8 pl-4 text-sm leading-7 text-slate-400 transition-colors group-hover:border-amber-300/25 group-hover:text-slate-300">
            {skill.description}
          </p>
        </div>

        {skill.tags && skill.tags.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {skill.tags.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[10px] font-mono text-slate-400"
              >
                <Tag size={8} className="text-amber-300" />
                {tag}
              </span>
            ))}
            {skill.tags.length > 4 && (
              <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[10px] font-mono text-slate-500">
                +{skill.tags.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-white/8 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-amber-500/80">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.65)]" />
              Skill
            </div>
            {skill.downloadCount !== undefined && skill.downloadCount > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                <Download size={10} />
                {skill.downloadCount.toLocaleString()}
              </div>
            )}
            {skill.bundleSize ? (
              <span className="text-[10px] font-mono text-slate-600">{formatBytes(skill.bundleSize)}</span>
            ) : null}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onView(skill); }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-100 transition-all duration-200 hover:border-amber-400/35 hover:bg-amber-400/10 hover:text-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 motion-reduce:transition-none"
          >
            Get
            <Download size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
