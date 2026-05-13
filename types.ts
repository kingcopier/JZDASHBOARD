export type Category = 'Development' | 'Design' | 'Marketing' | 'Operations' | 'Inspiration' | 'Other';

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  description: string;
  category: Category;
  createdAt: number;
}

export const CATEGORIES: Category[] = [
  'Development',
  'Design',
  'Marketing',
  'Operations',
  'Inspiration',
  'Other'
];