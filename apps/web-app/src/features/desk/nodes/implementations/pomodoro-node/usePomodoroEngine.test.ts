// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { useCallback, useState } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../lib/audio", () => ({
  initAudioContext: vi.fn(),
  playBeep: vi.fn(),
}));

import { initAudioContext, playBeep } from "../../lib/audio";
import { usePomodoroEngine } from "./usePomodoroEngine";
import type { PomodoroNodeData, PomodoroSettings } from "./types";

const MS_MIN = 60_000;
const NOW = new Date("2026-01-01T00:00:00Z").getTime();

const DEFAULT_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
};

function makeData(overrides: Partial<PomodoroNodeData> = {}): PomodoroNodeData {
  return {
    settings: DEFAULT_SETTINGS,
    phase: "work",
    status: "idle",
    endsAt: null,
    remainingMs: null,
    completedWorkSessions: 0,
    ...overrides,
  };
}

/** Harness that mirrors how the real component feeds node `data` back through
 * React state after each `updateNodeData` write, so the engine observes its
 * own mutations naturally. */
function useHarness(initial: PomodoroNodeData) {
  const [data, setData] = useState<PomodoroNodeData>(initial);
  const updateNodeData = useCallback(
    (_id: string, patch: Partial<PomodoroNodeData>) => {
      setData((prev) => ({ ...prev, ...patch }));
    },
    [],
  );
  const engine = usePomodoroEngine("n1", data, updateNodeData);
  return { engine, data, updateNodeData };
}

function render(initial: PomodoroNodeData) {
  return renderHook(() => useHarness(initial));
}

describe("usePomodoroEngine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial state", () => {
    test("idle work phase shows full work duration", () => {
      const { result } = render(makeData());
      expect(result.current.engine.phase).toBe("work");
      expect(result.current.engine.status).toBe("idle");
      expect(result.current.engine.totalMs).toBe(25 * MS_MIN);
      expect(result.current.engine.displayMs).toBe(25 * MS_MIN);
      expect(result.current.engine.completedWorkSessions).toBe(0);
    });

    test("paused phase derives display from remainingMs", () => {
      const { result } = render(
        makeData({ status: "paused", remainingMs: 18.5 * MS_MIN }),
      );
      expect(result.current.engine.displayMs).toBe(18.5 * MS_MIN);
    });

    test("running phase derives display from endsAt", () => {
      const { result } = render(
        makeData({ status: "running", endsAt: NOW + 10 * MS_MIN }),
      );
      expect(result.current.engine.displayMs).toBe(10 * MS_MIN);
    });
  });

  describe("start", () => {
    test("transitions idle to running and primes audio (no beep)", () => {
      const { result } = render(makeData());

      act(() => result.current.engine.start());

      expect(result.current.data.status).toBe("running");
      expect(result.current.data.endsAt).toBe(NOW + 25 * MS_MIN);
      expect(result.current.data.remainingMs).toBeNull();
      expect(initAudioContext).toHaveBeenCalledTimes(1);
      expect(playBeep).not.toHaveBeenCalled();
    });

    test("resume from paused sets endsAt from remainingMs", () => {
      const { result } = render(
        makeData({ status: "paused", remainingMs: 7 * MS_MIN }),
      );

      act(() => result.current.engine.start());

      expect(result.current.data.status).toBe("running");
      expect(result.current.data.endsAt).toBe(NOW + 7 * MS_MIN);
      expect(result.current.data.remainingMs).toBeNull();
    });
  });

  describe("pause", () => {
    test("running to paused captures remaining time and clears endsAt", () => {
      const { result } = render(
        makeData({ status: "running", endsAt: NOW + 25 * MS_MIN }),
      );

      act(() => vi.advanceTimersByTime(10 * MS_MIN));
      act(() => result.current.engine.pause());

      expect(result.current.data.status).toBe("paused");
      expect(result.current.data.endsAt).toBeNull();
      expect(result.current.data.remainingMs).toBe(15 * MS_MIN);
    });

    test("no-ops when not running", () => {
      const { result } = render(makeData());
      const before = result.current.data;

      act(() => result.current.engine.pause());

      expect(result.current.data).toBe(before);
    });
  });

  describe("reset", () => {
    test("returns to idle work with cleared counters (no beep)", () => {
      const { result } = render(
        makeData({
          phase: "short-break",
          status: "running",
          endsAt: NOW + 3 * MS_MIN,
          completedWorkSessions: 2,
        }),
      );

      act(() => result.current.engine.reset());

      expect(result.current.data).toMatchObject({
        phase: "work",
        status: "idle",
        endsAt: null,
        remainingMs: null,
        completedWorkSessions: 0,
      });
      expect(result.current.engine.displayMs).toBe(25 * MS_MIN);
      expect(playBeep).not.toHaveBeenCalled();
    });
  });

  describe("skip", () => {
    test("from work advances to short break and beeps twice at 660 Hz", () => {
      const { result } = render(makeData());

      act(() => result.current.engine.skip());

      expect(result.current.data.phase).toBe("short-break");
      expect(result.current.data.status).toBe("running");
      expect(result.current.data.completedWorkSessions).toBe(1);
      expect(result.current.data.endsAt).toBe(NOW + 5 * MS_MIN);
      expect(playBeep).toHaveBeenCalledWith(2, 660);
    });

    test("from break advances to work and beeps three times at 880 Hz", () => {
      const { result } = render(
        makeData({ phase: "short-break", completedWorkSessions: 1 }),
      );

      act(() => result.current.engine.skip());

      expect(result.current.data.phase).toBe("work");
      expect(result.current.data.status).toBe("running");
      expect(result.current.data.endsAt).toBe(NOW + 25 * MS_MIN);
      expect(playBeep).toHaveBeenCalledWith(3, 880);
    });

    test("long break after the configured session count", () => {
      const { result } = render(
        makeData({ phase: "work", completedWorkSessions: 3 }),
      );

      act(() => result.current.engine.skip());

      expect(result.current.data.phase).toBe("long-break");
      expect(result.current.data.completedWorkSessions).toBe(4);
      expect(result.current.data.endsAt).toBe(NOW + 15 * MS_MIN);
    });
  });

  describe("updateSettings", () => {
    test("applies new settings when not running and recomputes display", () => {
      const { result } = render(makeData());
      const next: PomodoroSettings = {
        workMinutes: 10,
        shortBreakMinutes: 2,
        longBreakMinutes: 8,
        sessionsBeforeLongBreak: 3,
      };

      act(() => result.current.engine.updateSettings(next));

      expect(result.current.data.settings).toEqual(next);
      expect(result.current.engine.totalMs).toBe(10 * MS_MIN);
      expect(result.current.engine.displayMs).toBe(10 * MS_MIN);
    });

    test("updates remainingMs when paused so resume uses the new duration", () => {
      const { result } = render(
        makeData({ phase: "work", status: "paused", remainingMs: 5 * MS_MIN }),
      );
      const next = { ...DEFAULT_SETTINGS, workMinutes: 40 };

      act(() => result.current.engine.updateSettings(next));

      expect(result.current.data.settings.workMinutes).toBe(40);
      expect(result.current.data.remainingMs).toBe(40 * MS_MIN);
    });

    test("no-ops while running", () => {
      const { result } = render(
        makeData({ status: "running", endsAt: NOW + 25 * MS_MIN }),
      );
      const before = result.current.data;

      act(() =>
        result.current.engine.updateSettings({
          ...DEFAULT_SETTINGS,
          workMinutes: 1,
        }),
      );

      expect(result.current.data).toBe(before);
      expect(result.current.engine.totalMs).toBe(25 * MS_MIN);
    });
  });

  describe("running countdown + auto-advance", () => {
    test("ticking does not call updateNodeData on every tick", () => {
      const updateNodeData = vi.fn();
      const { result } = renderHook(() =>
        usePomodoroEngine(
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

    test("advances phase + beeps when endsAt is reached mid-run", () => {
      const { result } = render(
        makeData({ status: "running", endsAt: NOW + 1 * MS_MIN }),
      );

      act(() => vi.advanceTimersByTime(60 * 1000));

      expect(result.current.data.phase).toBe("short-break");
      expect(result.current.data.status).toBe("running");
      expect(result.current.data.completedWorkSessions).toBe(1);
      expect(playBeep).toHaveBeenCalledWith(2, 660);
    });

    test("auto-chains: break end transitions back to work", () => {
      const { result } = render(
        makeData({
          phase: "short-break",
          status: "running",
          endsAt: NOW + 1 * MS_MIN,
          completedWorkSessions: 1,
        }),
      );

      act(() => vi.advanceTimersByTime(60 * 1000));

      expect(result.current.data.phase).toBe("work");
      expect(playBeep).toHaveBeenCalledWith(3, 880);
    });
  });

  describe("catch-up across remounts", () => {
    test("processes one transition on mount when endsAt is already in the past", () => {
      const { result } = render(
        makeData({ status: "running", endsAt: NOW - 10 * MS_MIN }),
      );

      expect(result.current.data.phase).toBe("short-break");
      expect(result.current.data.completedWorkSessions).toBe(1);
      expect(result.current.data.endsAt).toBe(NOW + 5 * MS_MIN);
      expect(playBeep).toHaveBeenCalledTimes(1);
    });

    test("does not burn through a long backlog in a tight loop (one per tick)", () => {
      const { result } = render(
        makeData({ status: "running", endsAt: NOW - 3 * 60 * MS_MIN }),
      );

      expect(result.current.data.completedWorkSessions).toBe(1);

      act(() => vi.advanceTimersByTime(250));
      expect(
        result.current.data.completedWorkSessions,
        "second transition only after the new phase ends",
      ).toBe(1);

      expect(playBeep).toHaveBeenCalledTimes(1);
    });
  });
});
