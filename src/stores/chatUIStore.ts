import type { DeviceType } from "@/hooks";
import { create } from "zustand";

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

type ChatUIStore = ChatUIStoreState & ChatUIStoreActions

export const chatUIStore = create<ChatUIStore>()((set) => ({
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
}))


