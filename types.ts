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
  updatedAt?: number;
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
}
