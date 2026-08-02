import { create } from "zustand";

type SelectedWorkspaceStore = {
  selectedWorkspaceId: string | null;
  selectWorkspace: (id: string | null) => void;
};

export const useSelectedWorkspaceStore = create<SelectedWorkspaceStore>(
  () => ({
    selectedWorkspaceId: null,
    selectWorkspace: (id) => {
      useSelectedWorkspaceStore.setState({ selectedWorkspaceId: id });
    },
  }),
);
