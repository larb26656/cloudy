import { beforeEach, describe, expect, it } from "vitest";
import { useGlobalEventLogStore } from "./globalEventLogStore";

describe("global event log store", () => {
  beforeEach(() => {
    useGlobalEventLogStore.getState().clearEvents();
  });

  it("keeps the newest 500 events in newest-first order", () => {
    for (let index = 0; index < 501; index += 1) {
      useGlobalEventLogStore.getState().appendEvent({ index });
    }

    const events = useGlobalEventLogStore.getState().events;
    expect(events).toHaveLength(500);
    expect(events[0]?.payload).toEqual({ index: 500 });
    expect(events.at(-1)?.payload).toEqual({ index: 1 });
  });

  it("clears the event log", () => {
    useGlobalEventLogStore.getState().appendEvent({ type: "heartbeat" });
    useGlobalEventLogStore.getState().clearEvents();

    expect(useGlobalEventLogStore.getState().events).toEqual([]);
  });
});
