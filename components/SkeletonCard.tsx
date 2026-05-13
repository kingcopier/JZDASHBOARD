import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="animate-pulse bg-[#0a0a0c] border border-zinc-800/80 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Fake image strip */}
      <div className="h-40 bg-zinc-800/60" />

      <div className="p-6 flex flex-col gap-4 flex-grow">
        {/* Header row: index + category badge */}
        <div className="flex items-center gap-3">
          <div className="h-3 w-6 bg-zinc-800 rounded" />
          <div className="h-5 w-24 bg-zinc-800 rounded-md" />
        </div>

        {/* Title */}
        <div className="h-6 w-3/4 bg-zinc-800 rounded" />

        {/* Description lines */}
        <div className="space-y-2 flex-grow">
          <div className="h-3 w-full bg-zinc-800 rounded" />
          <div className="h-3 w-5/6 bg-zinc-800 rounded" />
          <div className="h-3 w-4/6 bg-zinc-800 rounded" />
        </div>

        {/* Tags */}
        <div className="flex gap-2">
          <div className="h-5 w-14 bg-zinc-800 rounded-full" />
          <div className="h-5 w-16 bg-zinc-800 rounded-full" />
          <div className="h-5 w-10 bg-zinc-800 rounded-full" />
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-900 flex justify-between items-center">
          <div className="h-3 w-28 bg-zinc-800 rounded" />
          <div className="h-3 w-20 bg-zinc-800 rounded" />
        </div>
      </div>
    </div>
  );
};
