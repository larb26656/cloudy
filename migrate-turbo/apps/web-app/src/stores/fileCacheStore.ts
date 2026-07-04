import { type MessageFileItem } from "@/types/message";
import { create } from "zustand";

type FileCacheState = {
  fileMap: Record<string, MessageFileItem[]>;
  setFiles: (messageId: string, files: MessageFileItem[]) => void;
  getFiles: (messageId: string) => MessageFileItem[] | null;
};

export const useFileCacheStore = create<FileCacheState>()((set, get) => ({
  fileMap: {},

  setFiles: (messageId, files) => {
    set((state) => ({
      fileMap: { ...state.fileMap, [messageId]: files },
    }));
  },

  getFiles: (messageId) => {
    return get().fileMap[messageId] ?? null;
  },
}));