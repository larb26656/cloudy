import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const WORKSPACE_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F43F5E",
  "#F59E0B",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
  "#64748B",
] as const;

export type WorkspaceColor = (typeof WORKSPACE_COLORS)[number];

export interface Workspace {
  id: string;
  instanceId: string;
  name: string;
  color: WorkspaceColor;
  directory: string;
  createdAt: number;
}

export interface WorkspaceStore {
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  createWorkspace: (instanceId: string, data: { name: string; color: WorkspaceColor; directory: string }, autoSelected?: boolean) => Workspace;
  deleteWorkspace: (id: string) => void;
  setCurrentWorkspace: (id: string) => void;
  getCurrentWorkspace: () => Workspace | undefined;
}

const generateId = () => crypto.randomUUID();

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspaceId: null,

      createWorkspace: (instanceId, data, autoSelected = false) => {
        const workspace: Workspace = {
          id: generateId(),
          instanceId,
          name: data.name,
          color: data.color,
          directory: data.directory,
          createdAt: Date.now(),
        };

        set((state) => ({
          workspaces: [...state.workspaces, workspace],
          currentWorkspaceId: autoSelected ? workspace.id : undefined,
        }));

        return workspace;
      },

      deleteWorkspace: (id) => {
        set((state) => {
          const newWorkspaces = state.workspaces.filter((w) => w.id !== id);
          let newCurrentId = state.currentWorkspaceId;
          if (state.currentWorkspaceId === id) {
            newCurrentId = newWorkspaces[0]?.id ?? null;
          }
          return {
            workspaces: newWorkspaces,
            currentWorkspaceId: newCurrentId,
          };
        });
      },

      setCurrentWorkspace: (id) => {
        set({ currentWorkspaceId: id });
      },

      getCurrentWorkspace: () => {
        const { workspaces, currentWorkspaceId } = get();
        return workspaces.find((w) => w.id === currentWorkspaceId);
      },
    }),
    {
      name: `cloudy-workspaces`,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
