import React, { useState } from 'react';
import { ArrowLeft, Users, LayoutGrid, Tag, KeyRound, Mail } from 'lucide-react';
import { UsersTab } from './settings/UsersTab';
import { SectionsTab } from './settings/SectionsTab';
import { TagsTab } from './settings/TagsTab';
import { VaultTab } from './settings/VaultTab';
import { RequestsTab } from './settings/RequestsTab';

type Tab = 'users' | 'sections' | 'tags' | 'vault' | 'requests';

const TABS: { id: Tab; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { id: 'users',    label: 'Users',    Icon: ({ size }) => <Users size={size} /> },
  { id: 'sections', label: 'Sections', Icon: ({ size }) => <LayoutGrid size={size} /> },
  { id: 'tags',     label: 'Tags',     Icon: ({ size }) => <Tag size={size} /> },
  { id: 'vault',    label: 'Vault',    Icon: ({ size }) => <KeyRound size={size} /> },
  { id: 'requests', label: 'Requests', Icon: ({ size }) => <Mail size={size} /> },
];

interface SettingsPageProps {
  onBack: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 overflow-x-hidden">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[20%] w-[500px] h-[500px] bg-purple-600/6 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={onBack}
            className="flex items-center gap-2 font-mono text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft size={14} />
            <span className="tracking-wider uppercase">Dashboard</span>
          </button>
          <div className="h-4 w-px bg-zinc-800" />
          <h1 className="font-orbitron font-black text-xl text-zinc-100 uppercase tracking-wider">
            Settings
          </h1>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-8 p-1 bg-[#0a0a0c] border border-zinc-800 rounded-xl w-fit">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === id
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="animate-fade-in-up">
          {activeTab === 'users'    && <UsersTab />}
          {activeTab === 'sections' && <SectionsTab />}
          {activeTab === 'tags'     && <TagsTab />}
          {activeTab === 'vault'    && <VaultTab />}
          {activeTab === 'requests' && <RequestsTab />}
        </div>
      </div>
    </div>
  );
};
