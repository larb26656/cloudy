import { create } from 'zustand';
import type { Idea } from '@/types/memory';

const mockIdeas: Idea[] = [
  {
    id: '1',
    name: 'Dark Mode Toggle',
    description: 'Add a toggle for dark/light mode in settings',
    markdown: `# Dark Mode Toggle

## Description
Implement a theme toggle that allows users to switch between dark and light modes.

## Implementation Steps
1. Add theme state to settings store
2. Create toggle component
3. Persist preference to localStorage
4. Apply theme class to document

## Priority
- **High** - User-facing feature

## Status
- [x] In Progress`,
    tags: ['ui', 'theme', 'settings'],
    status: 'in-progress',
    priority: 'high',
    created: new Date('2024-01-20'),
    updated: new Date('2024-01-25'),
  },
  {
    id: '2',
    name: 'Export to PDF',
    description: 'Allow users to export conversations as PDF',
    markdown: `# Export to PDF

## Description
Add functionality to export chat conversations or memories as PDF documents.

## Technical Approach
- Use browser print API or html2pdf library
- Create print-optimized stylesheet
- Handle pagination for long content

## Priority
- **Medium** - Nice to have

## Status
- [ ] Draft`,
    tags: ['export', 'pdf', 'feature'],
    status: 'draft',
    priority: 'medium',
    created: new Date('2024-02-01'),
    updated: new Date('2024-02-01'),
  },
  {
    id: '3',
    name: 'Keyboard Shortcuts',
    description: 'Add keyboard shortcuts for common actions',
    markdown: `# Keyboard Shortcuts

## Description
Implement keyboard shortcuts for power users to navigate faster.

## Shortcuts to Implement
- \`Ctrl+K\` - Quick search
- \`Ctrl+N\` - New session
- \`Ctrl+/\` - Show help
- \`Esc\` - Close dialogs

## Status
- [x] Completed`,
    tags: ['ux', 'productivity', 'shortcuts'],
    status: 'completed',
    priority: 'low',
    created: new Date('2024-01-10'),
    updated: new Date('2024-01-15'),
  },
  {
    id: '4',
    name: 'Mobile App',
    description: 'Build a mobile companion app',
    markdown: `# Mobile App

## Vision
Native mobile app for iOS and Android with core features.

## Core Features
- View memories on the go
- Quick idea capture
- Push notifications
- Offline support

## Status
- [ ] Archived - Deprioritized for now`,
    tags: ['mobile', 'app', 'future'],
    status: 'archived',
    priority: 'low',
    created: new Date('2023-12-01'),
    updated: new Date('2023-12-15'),
  },
];

type IdeaStoreState = {
  ideas: Idea[];
  selectedIdeaId: string | null;
  isLoading: boolean;
  searchQuery: string;
  filterStatus: Idea['status'] | 'all';
}

type IdeaStoreActions = {
  loadIdeas: () => Promise<void>;
  createIdea: (idea: Omit<Idea, 'id' | 'created' | 'updated'>) => Idea;
  updateIdea: (id: string, updates: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
  selectIdea: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: Idea['status'] | 'all') => void;
  getFilteredIdeas: () => Idea[];
}

type IdeaStore = IdeaStoreState & IdeaStoreActions;

export const useIdeaStore = create<IdeaStore>()(
  (set, get) => ({
    ideas: [],
    selectedIdeaId: null,
    isLoading: false,
    searchQuery: '',
    filterStatus: 'all',

    loadIdeas: async () => {
      set({ isLoading: true });
      await new Promise((resolve) => setTimeout(resolve, 500));
      set({ ideas: mockIdeas, isLoading: false });
    },

    createIdea: (ideaData) => {
      const newIdea: Idea = {
        ...ideaData,
        id: crypto.randomUUID(),
        created: new Date(),
        updated: new Date(),
      };
      set((state) => ({ ideas: [newIdea, ...state.ideas] }));
      return newIdea;
    },

    updateIdea: (id, updates) => {
      set((state) => ({
        ideas: state.ideas.map((i) =>
          i.id === id ? { ...i, ...updates, updated: new Date() } : i
        ),
      }));
    },

    deleteIdea: (id) => {
      set((state) => ({
        ideas: state.ideas.filter((i) => i.id !== id),
        selectedIdeaId: state.selectedIdeaId === id ? null : state.selectedIdeaId,
      }));
    },

    selectIdea: (id) => {
      set({ selectedIdeaId: id });
    },

    setSearchQuery: (query) => {
      set({ searchQuery: query });
    },

    setFilterStatus: (status) => {
      set({ filterStatus: status });
    },

    getFilteredIdeas: () => {
      const { ideas, searchQuery, filterStatus } = get();
      let filtered = ideas;

      if (filterStatus !== 'all') {
        filtered = filtered.filter((i) => i.status === filterStatus);
      }

      if (!searchQuery.trim()) return filtered;
      const query = searchQuery.toLowerCase();
      return filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(query) ||
          i.description.toLowerCase().includes(query) ||
          i.tags.some((t) => t.toLowerCase().includes(query))
      );
    },
  })
);
