// stores/uiStore.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  detailsPanelOpen: boolean;
  isDarkMode: boolean;
  searchQuery: string;
  selectedDirectory: string | null;
  recentDirectories: string[];
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  
  // Actions
  toggleSidebar: () => void;
  toggleDetailsPanel: () => void;
  toggleTheme: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedDirectory: (directory: string | null) => void;
  addRecentDirectory: (directory: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  detailsPanelOpen: false,
  isDarkMode: false,
  searchQuery: '',
  selectedDirectory: null,
  recentDirectories: [],
  toast: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleDetailsPanel: () => set((state) => ({ detailsPanelOpen: !state.detailsPanelOpen })),
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedDirectory: (directory) => set({ selectedDirectory: directory }),
  addRecentDirectory: (directory) => set((state) => ({
    recentDirectories: [directory, ...state.recentDirectories.filter(d => d !== directory)].slice(0, 5)
  })),
  showToast: (message, type) => set({ toast: { message, type } }),
  clearToast: () => set({ toast: null }),
}));
