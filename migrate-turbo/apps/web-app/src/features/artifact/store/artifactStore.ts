import { create } from 'zustand';
import type { ArtifactType } from '@/features/artifact/types';

type ArtifactUIState = {
  selectedArtifactId: string | null;
  searchQuery: string;
  filterType: ArtifactType | 'all';
}

type ArtifactUIActions = {
  selectArtifact: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (type: ArtifactType | 'all') => void;
}

type ArtifactUIStore = ArtifactUIState & ArtifactUIActions;

export const useArtifactUIStore = create<ArtifactUIStore>()((set) => ({
  selectedArtifactId: null,
  searchQuery: '',
  filterType: 'all',

  selectArtifact: (id) => set({ selectedArtifactId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterType: (type) => set({ filterType: type }),
}));

export function filterArtifacts<T extends { name: string; description: string; meta: { title?: string; tags: string[]; type: ArtifactType } }>(
  artifacts: T[],
  searchQuery: string,
  filterType: ArtifactType | 'all'
): T[] {
  let filtered = artifacts;

  if (filterType !== 'all') {
    filtered = filtered.filter((a) => a.meta.type === filterType);
  }

  if (!searchQuery.trim()) return filtered;

  const query = searchQuery.toLowerCase();
  return filtered.filter(
    (a) =>
      a.name.toLowerCase().includes(query) ||
      a.description.toLowerCase().includes(query) ||
      a.meta.title?.toLowerCase().includes(query) ||
      a.meta.tags.some((t) => t.toLowerCase().includes(query))
  );
}
