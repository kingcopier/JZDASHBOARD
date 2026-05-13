import React from 'react';
import { ExternalLink, Edit2, Trash2, Globe, Code, Briefcase, PenTool, Lightbulb, Zap, ArrowUpRight } from 'lucide-react';
import { LinkItem, Category } from '../types';

interface LinkCardProps {
  link: LinkItem;
  index: number;
  onEdit: (link: LinkItem) => void;
  onDelete: (id: string) => void;
  isAuthenticated: boolean;
}

const getCategoryIcon = (category: Category) => {
  switch (category) {
    case 'Development': return <Code size={12} />;
    case 'Design': return <PenTool size={12} />;
    case 'Marketing': return <Globe size={12} />;
    case 'Operations': return <Briefcase size={12} />;
    case 'Inspiration': return <Lightbulb size={12} />;
    default: return <Zap size={12} />;
  }
};

const getCategoryColor = (category: Category) => {
    switch (category) {
      case 'Development': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'Design': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'Marketing': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'Operations': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'Inspiration': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      default: return 'text-zinc-400 border-zinc-700 bg-zinc-800';
    }
  };

export const LinkCard: React.FC<LinkCardProps> = ({ link, index, onEdit, onDelete, isAuthenticated }) => {
  // Format index to look like an ID (e.g. 01, 02)
  const formattedIndex = (index + 1).toString().padStart(2, '0');

  return (
    <div className="group relative flex flex-col h-full bg-[#0a0a0c] border border-zinc-800/80 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
      
      {/* Decorative Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent group-hover:via-cyan-500/50 transition-all duration-500" />
      
      <div className="p-6 flex flex-col h-full">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-zinc-600 group-hover:text-cyan-500/70 transition-colors">#{formattedIndex}</span>
                <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md border text-[10px] uppercase font-bold tracking-wider ${getCategoryColor(link.category)}`}>
                    {getCategoryIcon(link.category)}
                    <span>{link.category}</span>
                </div>
            </div>

            {isAuthenticated && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(link); }}
                    aria-label={`Edit ${link.title}`}
                    className="p-2 text-zinc-500 hover:text-cyan-400 hover:bg-cyan-950/50 rounded-lg transition-colors"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(link.id); }}
                    aria-label={`Delete ${link.title}`}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/50 rounded-lg transition-colors"
                >
                    <Trash2 size={14} />
                </button>
                </div>
            )}
        </div>

        {/* Title & Desc */}
        <div className="mb-6 flex-grow">
            <h3 className="text-xl font-bold text-zinc-100 mb-3 group-hover:text-cyan-400 transition-colors font-orbitron tracking-wide leading-tight">
                {link.title}
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-light border-l-2 border-zinc-800 pl-4 group-hover:border-cyan-500/30 transition-colors">
                {link.description}
            </p>
        </div>

        {/* Footer / Action */}
        <div className="pt-4 mt-auto border-t border-zinc-900 flex justify-between items-center">
             <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-green-500 transition-colors" />
                STATUS: DEPLOYED
             </div>

             <a 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-zinc-300 hover:text-cyan-400 transition-colors group-hover:translate-x-1 duration-300"
            >
                View Project <ArrowUpRight size={14} />
            </a>
        </div>
      </div>
    </div>
  );
};