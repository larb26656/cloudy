import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_HISTORY = 20;

type TextHistoryState = {
  histories: string[];
  cursorIndex: number;
};

type TextHistoryActions = {
  scrollUp: () => void;
  scrollDown: () => void;
  push: (text: string) => void;
  clear: () => void;
  resetCursor: () => void;
};

type TextHistoryStore = TextHistoryState & TextHistoryActions;

export const useTextHistoryStore = create<TextHistoryStore>()(
  persist(
    (set, get) => ({
      histories: [],
      cursorIndex: -1,

      resetCursor: () => set({ cursorIndex: -1 }),

      clear: () => set({ histories: [], cursorIndex: -1 }),

      push: (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set((state) => {
          const histories = [...state.histories, trimmed];
          if (histories.length > MAX_HISTORY) {
            histories.shift();
          }
          return { histories, cursorIndex: -1 };
        });
      },

      scrollUp: () => {
        const { histories } = get();
        if (histories.length === 0) return;

        set((state) => {
          if (state.cursorIndex === -1) return { cursorIndex: histories.length - 1 };
          if (state.cursorIndex === 0) return { cursorIndex: 0 };
          return { cursorIndex: state.cursorIndex - 1 };
        });
      },

      scrollDown: () => {
        set((state) => {
          if (state.cursorIndex === -1 || state.cursorIndex === get().histories.length - 1) {
            return { cursorIndex: -1 };
          }
          return { cursorIndex: state.cursorIndex + 1 };
        });
      },
    }),
    {
      name: "text-history",
    }
  )
);

export const useTextHistory = () => {
  const {
    histories,
    cursorIndex,
    scrollUp,
    scrollDown,
    push,
    clear,
    resetCursor,
  } = useTextHistoryStore();

  const currentValue = cursorIndex === -1 ? "" : histories[cursorIndex] ?? "";

  return {
    histories,
    cursorIndex,
    scrollUp,
    scrollDown,
    push,
    clear,
    currentValue,
    resetCursor,
  };
};