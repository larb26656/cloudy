import { create } from "zustand";

const MAX_EVENTS = 500;

export interface LoggedGlobalEvent {
  id: number;
  receivedAt: number;
  payload: unknown;
}

interface GlobalEventLogState {
  events: LoggedGlobalEvent[];
  appendEvent: (payload: unknown) => void;
  clearEvents: () => void;
}

let nextEventId = 0;

export const useGlobalEventLogStore = create<GlobalEventLogState>((set) => ({
  events: [],
  appendEvent: (payload) =>
    set((state) => ({
      events: [
        { id: ++nextEventId, receivedAt: Date.now(), payload },
        ...state.events,
      ].slice(0, MAX_EVENTS),
    })),
  clearEvents: () => set({ events: [] }),
}));
