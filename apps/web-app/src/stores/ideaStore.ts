import { create } from 'zustand';
import { parseIdeaFrontMatter, stringifyIdeaFrontMatter } from '@/lib/front-matter';
import type { Idea, IdeaStatus, IdeaPriority } from '@/types/memory';

function ideaFromMarkdown(name: string, markdown: string, id?: string): Idea {
  const parsed = parseIdeaFrontMatter(markdown, name);
  const now = new Date().toISOString();

  return {
    id: id || crypto.randomUUID(),
    name,
    markdown,
    description: parsed.content.split('\n')[0]?.replace(/^#+\s*/, '').trim() || name,
    meta: {
      title: parsed.meta.title || name,
      tags: parsed.meta.tags || [],
      status: parsed.meta.status || 'draft',
      priority: parsed.meta.priority || 'medium',
      createdAt: parsed.meta.createdAt || now,
      updatedAt: parsed.meta.updatedAt || now,
    },
  };
}

const mockIdeas: Idea[] = [
  ideaFromMarkdown(
    'Dark Mode Toggle',
    `---
title: Dark Mode Toggle
tags: ["ui", "theme", "settings"]
status: in-progress
priority: high
createdAt: 2024-01-20
updatedAt: 2024-01-25
---

# Dark Mode Toggle

## Description
Implement a theme toggle that allows users to switch between dark and light modes.

## Implementation Steps
1. Add theme state to settings store
2. Create toggle component
3. Persist preference to localStorage
4. Apply theme class to document`,
    '1'
  ),
  ideaFromMarkdown(
    'Export to PDF',
    `# Export to PDF

## Description
Add functionality to export chat conversations or memories as PDF documents.

## Technical Approach
- Use browser print API or html2pdf library
- Create print-optimized stylesheet
- Handle pagination for long content`,
    '2'
  ),
  ideaFromMarkdown(
    'Keyboard Shortcuts',
    `---
title: Keyboard Shortcuts
tags: ["ux", "productivity"]
status: completed
priority: low
createdAt: 2024-01-10
updatedAt: 2024-01-15
---

# Keyboard Shortcuts

## Description
Implement keyboard shortcuts for power users to navigate faster.

## Shortcuts to Implement
- \`Ctrl+K\` - Quick search
- \`Ctrl+N\` - New session
- \`Ctrl+/\` - Show help
- \`Esc\` - Close dialogs`,
    '3'
  ),
  ideaFromMarkdown(
    'Mobile App',
    `---
title: Mobile App
tags: ["mobile", "app"]
status: archived
priority: low
createdAt: 2023-12-01
updatedAt: 2023-12-15
---

# Mobile App

## Vision
Native mobile app for iOS and Android with core features.

## Core Features
- View memories on the go
- Quick idea capture
- Push notifications
- Offline support`,
    '4'
  ),
];

type IdeaStoreState = {
  ideas: Idea[];
  selectedIdeaId: string | null;
  isLoading: boolean;
  searchQuery: string;
  filterStatus: IdeaStatus | 'all';
}

type IdeaStoreActions = {
  loadIdeas: () => Promise<void>;
  createIdea: (idea: Omit<Idea, 'id' | 'meta'>) => Idea;
  updateIdea: (id: string, updates: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
  selectIdea: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: IdeaStatus | 'all') => void;
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
      const now = new Date().toISOString();
      const meta: Idea['meta'] = {
        title: ideaData.meta?.title || ideaData.name,
        tags: ideaData.meta?.tags || [],
        status: ideaData.meta?.status || 'draft',
        priority: ideaData.meta?.priority || 'medium',
        createdAt: now,
        updatedAt: now,
      };

      const newIdea: Idea = {
        ...ideaData,
        meta,
        id: crypto.randomUUID(),
      };

      newIdea.markdown = stringifyIdeaFrontMatter(meta, ideaData.content);

      set((state) => ({ ideas: [newIdea, ...state.ideas] }));
      return newIdea;
    },

    updateIdea: (id, updates) => {
      set((state) => ({
        ideas: state.ideas.map((i) => {
          if (i.id !== id) return i;

          const updated = { ...i, ...updates };
          const meta = {
            ...i.meta,
            ...updates.meta,
            updatedAt: new Date().toISOString(),
          };
          updated.meta = meta;
          updated.markdown = stringifyIdeaFrontMatter(meta, updated.content);

          return updated;
        }),
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
    },
  })
);
