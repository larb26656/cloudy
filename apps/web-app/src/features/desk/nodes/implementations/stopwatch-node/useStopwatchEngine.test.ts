// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { useCallback, useState } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  computeElapsed,
  formatStopwatch,
  useStopwatchEngine,
} from "./useStopwatchEngine";
import type { StopwatchNodeData } from "./types";

const NOW = new Date("2026-01-01T00:00:00Z").getTime();
const MS_SEC = 1000;
const MS_MIN = 60_000;
const MS_HOUR = 60 * MS_MIN;

function makeData(
  overrides: Partial<StopwatchNodeData> = {},
): StopwatchNodeData {
  return {
    accumulatedMs: 0,
    running: false,
    startedAt: null,
    ...overrides,
  };
}

/** Harness that mirrors how the real component feeds node `data` back through
 * React state after each `updateNodeData` write, so the engine observes its
 * own mutations naturally. */
function useHarness(initial: StopwatchNodeData) {
  const [data, setData] = useState<StopwatchNodeData>(initial);
  const updateNodeData = useCallback(
    (_id: string, patch: Partial<StopwatchNodeData>) => {
      setData((prev) => ({ ...prev, ...patch }));
    },
    [],
  );
  const engine = useStopwatchEngine("n1", data, updateNodeData);
  return { engine, data, updateNodeData };
}

function render(initial: StopwatchNodeData) {
  return renderHook(() => useHarness(initial));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
afterEach(() => {
  vi.useRealTimers();
});

describe("formatStopwatch", () => {
  test("zero shows 00:00.00", () => {
    expect(formatStopwatch(0)).toBe("00:00.00");
  });

  test("clamps negative to 00:00.00", () => {
    expect(formatStopwatch(-500)).toBe("00:00.00");
  });

  test("centiseconds floor to 2 digits", () => {
    expect(formatStopwatch(950)).toBe("00:00.95");
    expect(formatStopwatch(5)).toBe("00:00.00");
    expect(formatStopwatch(12)).toBe("00:00.01");
  });

  test("seconds and minutes roll over", () => {
    expect(formatStopwatch(65_420)).toBe("01:05.42");
    expect(formatStopwatch(9 * MS_MIN + 59_990)).toBe("09:59.99");
  });

  test("switches to H:MM:SS.cs at one hour", () => {
    expect(formatStopwatch(MS_HOUR)).toBe("1:00:00.00");
    expect(formatStopwatch(3 * MS_HOUR + 5 * MS_MIN + 42_300)).toBe(
      "3:05:42.30",
    );
  });
});

describe("computeElapsed", () => {
  test("stopped returns accumulatedMs", () => {
    expect(computeElapsed(makeData({ accumulatedMs: 5_000 }))).toBe(5_000);
  });

  test("running adds wall-clock since startedAt", () => {
    expect(
      computeElapsed(
        makeData({
          accumulatedMs: 2_000,
          running: true,
          startedAt: NOW - 3_000,
        }),
      ),
    ).toBe(5_000);
  });

  test("running with no startedAt falls back to accumulatedMs", () => {
    expect(
      computeElapsed(makeData({ accumulatedMs: 2_000, running: true })),
    ).toBe(2_000);
  });

  test("clamps negative clock skew to zero", () => {
    expect(
      computeElapsed(
        makeData({ accumulatedMs: 0, running: true, startedAt: NOW + 5_000 }),
      ),
    ).toBe(0);
  });
});

describe("useStopwatchEngine", () => {
  describe("initial state", () => {
    test("idle shows zero", () => {
      const { result } = render(makeData());
      expect(result.current.engine.displayMs).toBe(0);
    });

    test("paused shows accumulatedMs", () => {
      const { result } = render(makeData({ accumulatedMs: 12_500 }));
      expect(result.current.engine.displayMs).toBe(12_500);
    });

    test("running on mount derives from accumulatedMs + gap", () => {
      const { result } = render(
        makeData({
          accumulatedMs: 1_000,
          running: true,
          startedAt: NOW - 4_000,
        }),
      );
      expect(result.current.engine.displayMs).toBe(5_000);
    });
  });

  describe("start", () => {
    test("sets running true and primes startedAt without changing accumulated", () => {
      const { result } = render(makeData());
      act(() => result.current.engine.start());
      expect(result.current.data).toMatchObject({
        running: true,
        startedAt: NOW,
        accumulatedMs: 0,
      });
    });

    test("resume from paused keeps accumulatedMs and stamps startedAt", () => {
      const { result } = render(makeData({ accumulatedMs: 7_000 }));
      act(() => result.current.engine.start());
      expect(result.current.data).toMatchObject({
        running: true,
        startedAt: NOW,
        accumulatedMs: 7_000,
      });
    });
  });

  describe("pause", () => {
    test("captures elapsed into accumulatedMs and clears startedAt", () => {
      const { result } = render(makeData({ running: true, startedAt: NOW }));
      act(() => vi.advanceTimersByTime(10_000));
      act(() => result.current.engine.pause());
      expect(result.current.data).toMatchObject({
        running: false,
        startedAt: null,
        accumulatedMs: 10_000,
      });
      expect(result.current.engine.displayMs).toBe(10_000);
    });

    test("no-ops when not running", () => {
      const { result } = render(makeData({ accumulatedMs: 3_000 }));
      const before = result.current.data;
      act(() => result.current.engine.pause());
      expect(result.current.data).toBe(before);
    });
  });

  describe("reset", () => {
    test("zeroes everything", () => {
      const { result } = render(
        makeData({
          running: true,
          startedAt: NOW - 5_000,
          accumulatedMs: 42_000,
        }),
      );
      act(() => result.current.engine.reset());
      expect(result.current.data).toMatchObject({
        running: false,
        accumulatedMs: 0,
        startedAt: null,
      });
      expect(result.current.engine.displayMs).toBe(0);
    });
  });

  describe("running", () => {
    test("ticking does not call updateNodeData on every tick", () => {
      const updateNodeData = vi.fn();
      const { result } = renderHook(() =>
        useStopwatchEngine(
          "n1",
          makeData({ running: true, startedAt: NOW }),
          updateNodeData,
        ),
      );
      act(() => vi.advanceTimersByTime(50));
      act(() => vi.advanceTimersByTime(50));
      act(() => vi.advanceTimersByTime(50));
      expect(updateNodeData).not.toHaveBeenCalled();
      expect(result.current.displayMs).toBeGreaterThanOrEqual(100);
    });

    test("display advances with wall clock", () => {
      const { result } = render(makeData({ running: true, startedAt: NOW }));
      act(() => vi.advanceTimersByTime(2_500));
      expect(result.current.engine.displayMs).toBe(2_500);
    });
  });

  describe("catch-up across remount", () => {
    test("running with an old startedAt accounts for the wall-clock gap", () => {
      const { result, rerender } = render(
        makeData({ running: true, startedAt: NOW }),
      );
      act(() => vi.advanceTimersByTime(MS_HOUR + 5 * MS_MIN + 30 * MS_SEC));
      rerender();
      expect(result.current.engine.displayMs).toBe(
        MS_HOUR + 5 * MS_MIN + 30 * MS_SEC,
      );
    });
  });
});
