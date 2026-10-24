import { create } from "zustand";
import { persist } from "zustand/middleware";
import { arrayMove } from "@dnd-kit/sortable";

export type PinnedAgent = { providerId: string; agentId: string; name: string };

type PinnedAgentsStore = {
  pins: PinnedAgent[];
  addPin: (pin: PinnedAgent) => void;
  removePin: (providerId: string, agentId: string) => void;
  reorderPins: (activeId: string, overId: string) => void;
};

export const usePinnedAgentsStore = create<PinnedAgentsStore>()(
  persist(
    (set) => ({
      pins: [],
      addPin: (pin) =>
        set((state) => ({
          pins: [
            pin,
            ...state.pins.filter(
              (item) =>
                item.providerId !== pin.providerId ||
                item.agentId !== pin.agentId,
            ),
          ],
        })),
      removePin: (providerId, agentId) =>
        set((state) => ({
          pins: state.pins.filter(
            (pin) => pin.providerId !== providerId || pin.agentId !== agentId,
          ),
        })),
      reorderPins: (activeId, overId) =>
        set((state) => {
          const from = state.pins.findIndex(
            (pin) => `${pin.providerId}:${pin.agentId}` === activeId,
          );
          const to = state.pins.findIndex(
            (pin) => `${pin.providerId}:${pin.agentId}` === overId,
          );
          if (from < 0 || to < 0) return state;
          return { pins: arrayMove(state.pins, from, to) };
        }),
    }),
    {
      name: "pinned-agents",
      version: 1,
      migrate: (state) => state as PinnedAgentsStore,
    },
  ),
);
