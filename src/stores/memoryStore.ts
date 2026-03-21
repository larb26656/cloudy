import { create } from 'zustand';
import type { Memory } from '@/types/memory';

const mockMemories: Memory[] = [
  {
    id: '1',
    name: 'Project Architecture',
    content: 'Key architectural decisions for the project',
    markdown: `# Project Architecture

## Core Principles
- Modular design with clear separation of concerns
- State management using Zustand
- Type-safe with TypeScript

## Key Patterns
1. Feature-based organization
2. Component composition
3. Store-driven state management`,
    tags: ['architecture', 'design'],
    created: new Date('2024-01-15'),
    updated: new Date('2024-01-20'),
  },
  {
    id: '2',
    name: 'API Integration Notes',
    content: 'Notes on OpenCode API integration',
    markdown: `# API Integration Notes

## Authentication
- Uses SDK client with base URL configuration
- Error handling with typed error responses

## Endpoints Used
- \`session.list\` - Get sessions
- \`session.create\` - Create new session
- \`message.send\` - Send messages`,
    tags: ['api', 'integration'],
    created: new Date('2024-02-10'),
    updated: new Date('2024-02-12'),
  },
  {
    id: '3',
    name: 'UI Component Patterns',
    content: 'Common patterns for UI components',
    markdown: `# UI Component Patterns

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
    tags: ['ui', 'components', 'patterns'],
    created: new Date('2024-03-01'),
    updated: new Date('2024-03-05'),
  },
  {
    id: '4',
    name: 'Routing Setup',
    content: 'TanStack Router configuration',
    markdown: `# Routing Setup

## File-based Routing
- Routes defined in \`/routes\` directory
- Layout routes with \`_prefix\`
- Nested routes for sub-pages

## Navigation
- Use \`Link\` component for client-side navigation
- \`useLocation\` for path checking`,
    tags: ['routing', 'tanstack'],
    created: new Date('2024-03-10'),
    updated: new Date('2024-03-10'),
  },
];

type MemoryStoreState = {
  memories: Memory[];
  selectedMemoryId: string | null;
  isLoading: boolean;
  searchQuery: string;
}

type MemoryStoreActions = {
  loadMemories: () => Promise<void>;
  createMemory: (memory: Omit<Memory, 'id' | 'created' | 'updated'>) => Memory;
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
      const newMemory: Memory = {
        ...memoryData,
        id: crypto.randomUUID(),
        created: new Date(),
        updated: new Date(),
      };
      set((state) => ({ memories: [newMemory, ...state.memories] }));
      return newMemory;
    },

    updateMemory: (id, updates) => {
      set((state) => ({
        memories: state.memories.map((m) =>
          m.id === id ? { ...m, ...updates, updated: new Date() } : m
        ),
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
          m.tags.some((t) => t.toLowerCase().includes(query))
      );
    },
  })
);
