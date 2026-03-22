import { create } from 'zustand';

type MemoryUIState = {
  selectedMemoryId: string | null;
  searchQuery: string;
}

type MemoryUIActions = {
  selectMemory: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
}

type MemoryUIStore = MemoryUIState & MemoryUIActions;

export const useMemoryUIStore = create<MemoryUIStore>()((set) => ({
  selectedMemoryId: null,
  searchQuery: '',

  selectMemory: (id) => set({ selectedMemoryId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
