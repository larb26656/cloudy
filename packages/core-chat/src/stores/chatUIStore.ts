import { getOc, getErrorMessage, type SdkError } from "../lib/client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DeviceType } from "../types/device";

type ChatUIStoreState = {
    deviceType: DeviceType;
    sidebarOpen: boolean;
    sidebarWidth: number;
    isDarkMode: boolean;
}

type ChatUIStoreActions = {
    setDeviceType: (deviceType: DeviceType) => void;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setSidebarWidth: (width: number) => void;
    toggleTheme: () => void;
}

export type ChatUIStore = ChatUIStoreState & ChatUIStoreActions

export const useChatUIStore = create<ChatUIStore>()(
    persist(
        (set) => ({
            deviceType: 'desktop',
            sidebarOpen: false,
            sidebarWidth: 0,
            isDarkMode: false,

            setDeviceType: (deviceType) => set({ deviceType }),

            toggleSidebar: () => set((state) => {
                const newValue = !state.sidebarOpen;
                return { sidebarOpen: newValue };
            }),

            setSidebarOpen: (open) => {
                set({ sidebarOpen: open });
            },

            setSidebarWidth: (width) => {
                const clampedWidth = Math.max(200, Math.min(400, width));
                set({ sidebarWidth: clampedWidth });
            },

            toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
        }),
        {
            name: 'chat-storage',
            partialize: (state) => ({
                sidebarOpen: state.sidebarOpen,
                sidebarWidth: state.sidebarWidth,
                isDarkMode: state.isDarkMode
            }),
        }
    )
)
