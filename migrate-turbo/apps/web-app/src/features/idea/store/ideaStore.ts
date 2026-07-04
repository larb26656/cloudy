import { create } from 'zustand';
import type { IdeaStatus } from '@/features/idea/types';

type IdeaUIState = {
  selectedIdeaId: string | null;
  searchQuery: string;
  filterStatus: IdeaStatus | 'all';
}

type IdeaUIActions = {
  selectIdea: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: IdeaStatus | 'all') => void;
}

type IdeaUIStore = IdeaUIState & IdeaUIActions;

export const useIdeaUIStore = create<IdeaUIStore>()((set) => ({
  selectedIdeaId: null,
  searchQuery: '',
  filterStatus: 'all',

  selectIdea: (id) => set({ selectedIdeaId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterStatus: (status) => set({ filterStatus: status }),
}));

export function filterIdeas<T extends { name: string; description: string; meta: { title?: string; tags: string[]; status: IdeaStatus } }>(
  ideas: T[],
  searchQuery: string,
  filterStatus: IdeaStatus | 'all'
): T[] {
  let filtered = ideas;

  if (filterStatus !== 'all') {
    filtered = filtered.filter((i) => i.meta.status === filterStatus);
  }

  if (!searchQuery.trim()) return filtered;

  const query = searchQuery.toLowerCase();
  return filtered.filter(
    (i) =>
      i.name.toLowerCase().includes(query) ||
      i.description.toLowerCase().includes(query) ||
      i.meta.title?.toLowerCase().includes(query) ||
      i.meta.tags.some((t) => t.toLowerCase().includes(query))
  );
}
