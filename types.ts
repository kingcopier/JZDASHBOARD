// ── User roles ──────────────────────────────────────────────────────────────
export type UserRole = 'pending' | 'public' | 'vip' | 'admin';

export interface UserRecord {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: number;
  approvedAt?: number;
}

// ── Project visibility ────────────────────────────────────────────────────────
export type ProjectVisibility = 'public' | 'vip' | 'admin';

// ── Categories (dynamic, stored in Firestore) ────────────────────────────────
export type Category = string; // now open-ended — driven by /categories collection

export interface CategoryItem {
  id: string;
  name: string;
  order: number;
  createdAt: number;
}

// Keep a static seed list for migration / fallback
export const DEFAULT_CATEGORIES: string[] = [
  'Development',
  'Design',
  'Marketing',
  'Operations',
  'Inspiration',
  'Skills',
  'Prompts',
  'Repositories',
  'Other',
];

// ── Tags ─────────────────────────────────────────────────────────────────────
export interface TagItem {
  id: string;
  name: string;   // normalised, e.g. "react"
  count: number;  // usage count across projects
  createdAt: number;
}

// ── App settings ────────────────────────────────────────────────────────────
export interface VaultSettings {
  phrase: string;
  terminalTitle?: string;
  denialCopy?: string;
  requestTitle?: string;
  requestCopy?: string;
  intensity?: 'subtle' | 'cinematic' | 'chaos';
  soundEnabled?: boolean;
  easterEggPhrase?: string;
  easterEggMessage?: string;
  easterEggVisual?: 'amber' | 'emerald' | 'rose';
  updatedAt?: number;
}

export interface VaultAnalyticsEvent {
  id: string;
  type: 'opened' | 'success' | 'denied' | 'easter';
  createdAt: number;
  source: 'vault';
  intensity?: 'subtle' | 'cinematic' | 'chaos';
}

// ── Access requests ─────────────────────────────────────────────────────────
export interface AccessRequest {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  source: 'vault-denied';
}

// ── Links / Projects ──────────────────────────────────────────────────────────
export interface LinkItem {
  id: string;
  title: string;
  url: string;
  description: string;
  category: Category;
  visibility: ProjectVisibility;
  createdAt: number;
  updatedAt?: number;
  authorUid?: string;
  tags?: string[];
  imageUrl?: string;
  viewCount?: number;
  type?: 'link' | 'note';
  content?: string;
  fileName?: string;
  bundleUrl?: string;
  bundleFileName?: string;
  bundleSize?: number;
}

// ── Skills (downloadable .skill bundles) ──────────────────────────────────────
export interface SkillItem {
  id: string;
  name: string;                 // from SKILL.md frontmatter `name`
  description: string;          // from SKILL.md frontmatter `description`
  readme?: string;              // SKILL.md body (markdown after frontmatter)
  category: Category;
  visibility: ProjectVisibility;
  tags?: string[];
  imageUrl?: string;
  bundleUrl: string;            // download URL in Firebase Storage
  bundleFileName: string;       // e.g. big-bird.skill
  bundleSize?: number;
  createdAt: number;
  updatedAt?: number;
  authorUid?: string;
  downloadCount?: number;
}
