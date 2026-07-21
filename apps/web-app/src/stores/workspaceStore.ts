import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateId } from "@/lib/id";

export const WORKSPACE_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
] as const;

export type Workspace = {
  id: string;
  instanceId: string;
  name: string;
  color: (typeof WORKSPACE_COLORS)[number];
  directory: string;
  createdAt: number;
};

type WorkspaceStore = {
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  selectWorkspace: (id: string) => void;
  clearSelectedWorkspace: () => void;
  getWorkspace: (id: string) => Workspace | undefined;
  getWorkspaceByDirectory: (directory: string) => Workspace | undefined;
  createWorkspace: (
    data: Omit<Workspace, "id" | "createdAt">,
  ) => { success: true; data: Workspace } | { success: false; error: string };
  updateWorkspace: (
    id: string,
    data: Partial<Omit<Workspace, "id" | "createdAt">>,
  ) => { success: true } | { success: false; error: string };
  deleteWorkspace: (id: string) => void;
};

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      workspaces: [],
      selectedWorkspaceId: null,

      selectWorkspace: (id) => set({ selectedWorkspaceId: id }),

      clearSelectedWorkspace: () => set({ selectedWorkspaceId: null }),

      getWorkspace: (id) => {
        return get().workspaces.find((w) => w.id === id);
      },

      getWorkspaceByDirectory: (directory) => {
        return get().workspaces.find((w) => w.directory === directory);
      },

      createWorkspace: (data) => {
        const existing = get().workspaces.find(
          (w) => w.directory === data.directory,
        );
        if (existing) {
          return {
            success: false,
            error: `Directory "${data.directory}" is already used`,
          };
        }

        const newWorkspace: Workspace = {
          ...data,
          id: `workspace-${generateId()}`,
          createdAt: Date.now(),
        };

        set((state) => ({
          workspaces: [...state.workspaces, newWorkspace],
          selectedWorkspaceId: newWorkspace.id,
        }));

        return { success: true, data: newWorkspace };
      },

      updateWorkspace: (id, data) => {
        const workspace = get().getWorkspace(id);
        if (!workspace) {
          return { success: false, error: "Workspace not found" };
        }

        if (data.directory && data.directory !== workspace.directory) {
          const existing = get().getWorkspaceByDirectory(data.directory);
          if (existing) {
            return {
              success: false,
              error: `Directory "${data.directory}" is already used`,
            };
          }
        }

        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === id ? { ...w, ...data } : w,
          ),
        }));

        return { success: true };
      },

      deleteWorkspace: (id) => {
        set((state) => ({
          workspaces: state.workspaces.filter((w) => w.id !== id),
          selectedWorkspaceId:
            state.selectedWorkspaceId === id ? null : state.selectedWorkspaceId,
        }));
      },
    }),
    { name: "workspaces" },
  ),
);
