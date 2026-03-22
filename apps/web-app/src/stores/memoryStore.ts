import { create } from 'zustand';
import { parseFrontMatter, stringifyFrontMatter } from '@/lib/front-matter';
import type { Memory } from '@/types/memory';

function memoryFromMarkdown(name: string, markdown: string, id?: string): Memory {
  const parsed = parseFrontMatter(markdown, name);
  const now = new Date().toISOString();

  return {
    id: id || crypto.randomUUID(),
    name,
    markdown,
    content: parsed.content.trim(),
    meta: {
      title: parsed.meta.title || name,
      tags: parsed.meta.tags || [],
      createdAt: parsed.meta.createdAt || now,
      updatedAt: parsed.meta.updatedAt || now,
    },
  };
}

const mockMemories: Memory[] = [
  memoryFromMarkdown(
    'Project Architecture',
    `---
title: Project Architecture
tags: ["architecture", "design"]
createdAt: 2024-01-15
updatedAt: 2024-01-20
---

# Project Architecture

## Core Principles
- Modular design with clear separation of concerns
- State management using Zustand
- Type-safe with TypeScript

## Key Patterns
1. Feature-based organization
2. Component composition
3. Store-driven state management`,
    '1'
  ),
  memoryFromMarkdown(
    'API Integration Notes',
    `# API Integration Notes

## Authentication
- Uses SDK client with base URL configuration
- Error handling with typed error responses

## Endpoints Used
- \`session.list\` - Get sessions
- \`session.create\` - Create new session
- \`message.send\` - Send messages`,
    '2'
  ),
  memoryFromMarkdown(
    'UI Component Patterns',
    `---
title: UI Component Patterns
tags: ["ui", "components"]
createdAt: 2024-03-01
updatedAt: 2024-03-05
---

# UI Component Patterns

## Component Structure
- Use Radix UI primitives for accessibility
- Tailwind CSS for styling
- Variant-based theming with cva

## Example
\`\`\`tsx
function Button({ variant = 'default', size = 'default' }) {
  return <button className={buttonVariants({ variant, size })} />;
}
\`\`\``,
    '3'
  ),
  memoryFromMarkdown(
    'Routing Setup',
    `# Routing Setup

## File-based Routing
- Routes defined in \`/routes\` directory
- Layout routes with \`_prefix\`
- Nested routes for sub-pages

## Navigation
- Use \`Link\` component for client-side navigation
- \`useLocation\` for path checking`,
    '4'
  ),
];

type MemoryStoreState = {
  memories: Memory[];
  selectedMemoryId: string | null;
  isLoading: boolean;
  searchQuery: string;
}

type MemoryStoreActions = {
  loadMemories: () => Promise<void>;
  createMemory: (memory: Omit<Memory, 'id' | 'meta'>) => Memory;
  updateMemory: (id: string, updates: Partial<Memory>) => void;
  deleteMemory: (id: string) => void;
  selectMemory: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  getFilteredMemories: () => Memory[];
}

type MemoryStore = MemoryStoreState & MemoryStoreActions;

export const useMemoryStore = create<MemoryStore>()(
  (set, get) => ({
    memories: [],
    selectedMemoryId: null,
    isLoading: false,
    searchQuery: '',

    loadMemories: async () => {
      set({ isLoading: true });
      await new Promise((resolve) => setTimeout(resolve, 500));
      set({ memories: mockMemories, isLoading: false });
    },

    createMemory: (memoryData) => {
      const now = new Date().toISOString();
      const meta = {
        title: memoryData.meta?.title || memoryData.name,
        tags: memoryData.meta?.tags || [],
        createdAt: now,
        updatedAt: now,
      };

      const newMemory: Memory = {
        ...memoryData,
        meta,
        id: crypto.randomUUID(),
      };

      newMemory.markdown = stringifyFrontMatter(meta, memoryData.content);

      set((state) => ({ memories: [newMemory, ...state.memories] }));
      return newMemory;
    },

    updateMemory: (id, updates) => {
      set((state) => ({
        memories: state.memories.map((m) => {
          if (m.id !== id) return m;

          const updated = { ...m, ...updates };
          const meta = {
            ...m.meta,
            ...updates.meta,
            updatedAt: new Date().toISOString(),
          };
          updated.meta = meta;
          updated.markdown = stringifyFrontMatter(meta, updated.content);

          return updated;
        }),
      }));
    },

    deleteMemory: (id) => {
      set((state) => ({
        memories: state.memories.filter((m) => m.id !== id),
        selectedMemoryId: state.selectedMemoryId === id ? null : state.selectedMemoryId,
      }));
    },

    selectMemory: (id) => {
      set({ selectedMemoryId: id });
    },

    setSearchQuery: (query) => {
      set({ searchQuery: query });
    },

    getFilteredMemories: () => {
      const { memories, searchQuery } = get();
      if (!searchQuery.trim()) return memories;
      const query = searchQuery.toLowerCase();
      return memories.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.content.toLowerCase().includes(query) ||
          m.meta.title?.toLowerCase().includes(query) ||
          m.meta.tags.some((t) => t.toLowerCase().includes(query))
      );
    },
  })
);
