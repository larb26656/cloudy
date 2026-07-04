import { create } from "zustand";

type LoadingState = {
    isLoading: boolean;
    message: string | null;
};

type LoadingActions = {
    showLoader: (message?: string) => void;
    hideLoader: () => void;
};

type LoadingStore = LoadingState & LoadingActions;

export const useLoadingStore = create<LoadingStore>()((set) => ({
    isLoading: false,
    message: null,
    showLoader: (message) => set({ isLoading: true, message: message ?? null }),
    hideLoader: () => set({ isLoading: false, message: null }),
}));
