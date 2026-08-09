// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { useCallback, useState } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../lib/audio", () => ({
  initAudioContext: vi.fn(),
  playBeep: vi.fn(),
}));

import { initAudioContext, playBeep } from "../../lib/audio";
import {
  computeRemaining,
  formatTimer,
  useTimerEngine,
} from "./useTimerEngine";
import type { TimerNodeData } from "./types";

const NOW = new Date("2026-01-01T00:00:00Z").getTime();
const MS_SEC = 1000;
const MS_MIN = 60_000;
const MS_HOUR = 60 * MS_MIN;

function makeData(overrides: Partial<TimerNodeData> = {}): TimerNodeData {
  return {
    targetMs: 5 * MS_MIN,
    status: "idle",
    endsAt: null,
    remainingMs: null,
    ...overrides,
  };
}

/** Harness that mirrors how the real component feeds node `data` back through
 * React state after each `updateNodeData` write, so the engine observes its
 * own mutations naturally. */
function useHarness(initial: TimerNodeData) {
  const [data, setData] = useState<TimerNodeData>(initial);
  const updateNodeData = useCallback(
    (_id: string, patch: Partial<TimerNodeData>) => {
      setData((prev) => ({ ...prev, ...patch }));
    },
    [],
  );
  const engine = useTimerEngine("n1", data, updateNodeData);
  return { engine, data, updateNodeData };
}

function render(initial: TimerNodeData) {
  return renderHook(() => useHarness(initial));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("formatTimer", () => {
  test("zero shows 00:00", () => {
    expect(formatTimer(0)).toBe("00:00");
  });

  test("clamps negative to 00:00", () => {
    expect(formatTimer(-500)).toBe("00:00");
  });

  test("ceils to the next second", () => {
    expect(formatTimer(1)).toBe("00:01");
    expect(formatTimer(999)).toBe("00:01");
    expect(formatTimer(1000)).toBe("00:01");
    expect(formatTimer(1001)).toBe("00:02");
  });

  test("minutes and seconds pad", () => {
    expect(formatTimer(5 * MS_MIN)).toBe("05:00");
    expect(formatTimer(5 * MS_MIN + 42_300)).toBe("05:43");
  });

  test("switches to H:MM:SS at one hour", () => {
    expect(formatTimer(MS_HOUR)).toBe("1:00:00");
    expect(formatTimer(3 * MS_HOUR + 5 * MS_MIN + 42_300)).toBe("3:05:43");
  });
});

describe("computeRemaining", () => {
  test("idle returns targetMs", () => {
    expect(computeRemaining(makeData({ targetMs: 7 * MS_MIN }))).toBe(
      7 * MS_MIN,
    );
  });

  test("running derives from endsAt", () => {
    expect(
      computeRemaining(makeData({ status: "running", endsAt: NOW + 30_000 })),
    ).toBe(30_000);
  });

  test("paused returns remainingMs", () => {
    expect(
      computeRemaining(makeData({ status: "paused", remainingMs: 12_000 })),
    ).toBe(12_000);
  });

  test("running clamps negative clock skew to zero", () => {
    expect(
      computeRemaining(makeData({ status: "running", endsAt: NOW - 5_000 })),
    ).toBe(0);
  });

  test("finished returns zero", () => {
    expect(computeRemaining(makeData({ status: "finished" }))).toBe(0);
  });
});

describe("useTimerEngine", () => {
  describe("initial state", () => {
    test("idle shows full target", () => {
      const { result } = render(makeData({ targetMs: 10 * MS_MIN }));
      expect(result.current.engine.status).toBe("idle");
      expect(result.current.engine.targetMs).toBe(10 * MS_MIN);
      expect(result.current.engine.displayMs).toBe(10 * MS_MIN);
    });

    test("paused derives display from remainingMs", () => {
      const { result } = render(
        makeData({ status: "paused", remainingMs: 90_000 }),
      );
      expect(result.current.engine.displayMs).toBe(90_000);
    });

    test("running derives display from endsAt", () => {
      const { result } = render(
        makeData({ status: "running", endsAt: NOW + 90_000 }),
      );
      expect(result.current.engine.displayMs).toBe(90_000);
    });
  });

  describe("start", () => {
    test("transitions idle to running and primes audio (no beep)", () => {
      const { result } = render(makeData());

      act(() => result.current.engine.start());

      expect(result.current.data.status).toBe("running");
      expect(result.current.data.endsAt).toBe(NOW + 5 * MS_MIN);
      expect(result.current.data.remainingMs).toBeNull();
      expect(initAudioContext).toHaveBeenCalledTimes(1);
      expect(playBeep).not.toHaveBeenCalled();
    });

    test("resume from paused uses remainingMs", () => {
      const { result } = render(
        makeData({ status: "paused", remainingMs: 2 * MS_MIN }),
      );

      act(() => result.current.engine.start());

      expect(result.current.data.status).toBe("running");
      expect(result.current.data.endsAt).toBe(NOW + 2 * MS_MIN);
      expect(result.current.data.remainingMs).toBeNull();
    });

    test("restart from finished re-arms from targetMs", () => {
      const { result } = render(makeData({ status: "finished" }));

      act(() => result.current.engine.start());

      expect(result.current.data.status).toBe("running");
      expect(result.current.data.endsAt).toBe(NOW + 5 * MS_MIN);
    });
  });

  describe("pause", () => {
    test("running to paused captures remaining time and clears endsAt", () => {
      const { result } = render(
        makeData({ status: "running", endsAt: NOW + 5 * MS_MIN }),
      );

      act(() => vi.advanceTimersByTime(2 * MS_MIN));
      act(() => result.current.engine.pause());

      expect(result.current.data.status).toBe("paused");
      expect(result.current.data.endsAt).toBeNull();
      expect(result.current.data.remainingMs).toBe(3 * MS_MIN);
    });

    test("no-ops when not running", () => {
      const { result } = render(makeData());
      const before = result.current.data;

      act(() => result.current.engine.pause());

      expect(result.current.data).toBe(before);
    });
  });

  describe("reset", () => {
    test("returns to idle and resets display to targetMs (no beep)", () => {
      const { result } = render(
        makeData({ status: "paused", remainingMs: 90_000 }),
      );

      act(() => result.current.engine.reset());

      expect(result.current.data).toMatchObject({
        status: "idle",
        endsAt: null,
        remainingMs: null,
      });
      expect(result.current.engine.displayMs).toBe(5 * MS_MIN);
      expect(playBeep).not.toHaveBeenCalled();
    });
  });

  describe("setTarget", () => {
    test("updates target and display when not running", () => {
      const { result } = render(makeData());

      act(() => result.current.engine.setTarget(10 * MS_MIN));

      expect(result.current.data.targetMs).toBe(10 * MS_MIN);
      expect(result.current.engine.displayMs).toBe(10 * MS_MIN);
    });

    test("clamps below 1 second to 1 second", () => {
      const { result } = render(makeData());

      act(() => result.current.engine.setTarget(200));

      expect(result.current.data.targetMs).toBe(1000);
    });

    test("updates remainingMs when paused so resume uses the new duration", () => {
      const { result } = render(
        makeData({ status: "paused", remainingMs: 90_000 }),
      );

      act(() => result.current.engine.setTarget(15 * MS_MIN));

      expect(result.current.data.targetMs).toBe(15 * MS_MIN);
      expect(result.current.data.remainingMs).toBe(15 * MS_MIN);
    });

    test("no-ops while running", () => {
      const { result } = render(
        makeData({ status: "running", endsAt: NOW + 5 * MS_MIN }),
      );
      const before = result.current.data;

      act(() => result.current.engine.setTarget(MS_HOUR));

      expect(result.current.data).toBe(before);
    });
  });

  describe("running countdown + completion", () => {
    test("ticking does not call updateNodeData on every tick", () => {
      const updateNodeData = vi.fn();
      const { result } = renderHook(() =>
        useTimerEngine(
          "n1",
          makeData({ status: "running", endsAt: NOW + 5 * MS_MIN }),
          updateNodeData,
        ),
      );

      act(() => vi.advanceTimersByTime(250));
      act(() => vi.advanceTimersByTime(250));
      act(() => vi.advanceTimersByTime(250));

      expect(updateNodeData).not.toHaveBeenCalled();
      expect(result.current.displayMs).toBeLessThan(5 * MS_MIN);
    });

    test("fires beep + transitions to finished when endsAt is reached", () => {
      const { result } = render(
        makeData({ status: "running", endsAt: NOW + 30 * MS_SEC }),
      );

      act(() => vi.advanceTimersByTime(30 * MS_SEC));

      expect(result.current.data.status).toBe("finished");
      expect(result.current.data.endsAt).toBeNull();
      expect(result.current.data.remainingMs).toBeNull();
      expect(result.current.engine.displayMs).toBe(0);
      expect(playBeep).toHaveBeenCalledWith(3, 880);
    });

    test("catch-up on mount when endsAt is already in the past", () => {
      const { result } = render(
        makeData({ status: "running", endsAt: NOW - 10 * MS_MIN }),
      );

      expect(result.current.data.status).toBe("finished");
      expect(playBeep).toHaveBeenCalledTimes(1);
    });

    test("does not loop after finishing (no second beep on next tick)", () => {
      const { result } = render(
        makeData({ status: "running", endsAt: NOW + MS_SEC }),
      );

      act(() => vi.advanceTimersByTime(MS_SEC));
      expect(playBeep).toHaveBeenCalledTimes(1);

      act(() => vi.advanceTimersByTime(5 * MS_SEC));
      expect(playBeep).toHaveBeenCalledTimes(1);
      expect(result.current.data.status).toBe("finished");
    });
  });
});
