// stores/uiStore.ts
import { create } from 'zustand';
import type { DeviceType } from '@/hooks/useDeviceType';

const STORAGE_KEYS = {
  SIDEBAR_OPEN: 'opencode-chat-sidebar-open',
  SIDEBAR_WIDTH: 'opencode-chat-sidebar-width',
  FULLSCREEN: 'opencode-chat-fullscreen',
} as const;

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

interface UIState {
  // Responsive
  deviceType: DeviceType;
  
  // Sidebar
  sidebarOpen: boolean;
  sidebarWidth: number;
  
  // Fullscreen
  isFullscreen: boolean;
  
  // Other UI state
  detailsPanelOpen: boolean;
  isDarkMode: boolean;
  searchQuery: string;
  selectedDirectory: string | null;
  recentDirectories: string[];
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  
  // Actions
  setDeviceType: (deviceType: DeviceType) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
  toggleFullscreen: () => void;
  toggleDetailsPanel: () => void;
  toggleTheme: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedDirectory: (directory: string | null) => void;
  addRecentDirectory: (directory: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  deviceType: 'desktop',
  
  sidebarOpen: getFromStorage(STORAGE_KEYS.SIDEBAR_OPEN, true),
  sidebarWidth: getFromStorage(STORAGE_KEYS.SIDEBAR_WIDTH, 320),
  
  isFullscreen: getFromStorage(STORAGE_KEYS.FULLSCREEN, false),
  
  detailsPanelOpen: false,
  isDarkMode: false,
  searchQuery: '',
  selectedDirectory: null,
  recentDirectories: [],
  toast: null,

  setDeviceType: (deviceType) => {
    const shouldOpenSidebar = deviceType === 'desktop';
    set({ 
      deviceType,
      sidebarOpen: shouldOpenSidebar
    });
  },
  
  toggleSidebar: () => set((state) => {
    const newValue = !state.sidebarOpen;
    setToStorage(STORAGE_KEYS.SIDEBAR_OPEN, newValue);
    return { sidebarOpen: newValue };
  }),
  
  setSidebarOpen: (open) => {
    setToStorage(STORAGE_KEYS.SIDEBAR_OPEN, open);
    set({ sidebarOpen: open });
  },
  
  setSidebarWidth: (width) => {
    const clampedWidth = Math.max(200, Math.min(400, width));
    setToStorage(STORAGE_KEYS.SIDEBAR_WIDTH, clampedWidth);
    set({ sidebarWidth: clampedWidth });
  },
  
  toggleFullscreen: () => set((state) => {
    const newValue = !state.isFullscreen;
    setToStorage(STORAGE_KEYS.FULLSCREEN, newValue);
    return { isFullscreen: newValue };
  }),
  
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
