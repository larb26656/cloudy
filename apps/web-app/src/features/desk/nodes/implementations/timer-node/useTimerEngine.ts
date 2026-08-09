import { useCallback, useEffect, useRef, useState } from "react";
import { initAudioContext, playBeep } from "../../lib/audio";
import type { TimerNodeData, TimerStatus } from "./types";

const TICK_MS = 250;
const FINISH_BEEP_FREQ = 880;
const FINISH_BEEP_TIMES = 3;

export function computeRemaining(data: TimerNodeData): number {
  if (data.status === "finished") return 0;
  if (data.status === "running" && data.endsAt != null) {
    return Math.max(0, data.endsAt - Date.now());
  }
  if (data.status === "paused" && data.remainingMs != null) {
    return Math.max(0, data.remainingMs);
  }
  return Math.max(0, data.targetMs);
}

export type TimerEngine = {
  status: TimerStatus;
  displayMs: number;
  targetMs: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setTarget: (ms: number) => void;
};

export function useTimerEngine(
  id: string,
  data: TimerNodeData,
  updateNodeData: (id: string, patch: Partial<TimerNodeData>) => void,
): TimerEngine {
  const [displayMs, setDisplayMs] = useState<number>(() =>
    computeRemaining(data),
  );

  const dataRef = useRef(data);
  dataRef.current = data;

  const finish = useCallback(() => {
    playBeep(FINISH_BEEP_TIMES, FINISH_BEEP_FREQ);
    updateNodeData(id, {
      status: "finished",
      endsAt: null,
      remainingMs: null,
    });
    setDisplayMs(0);
  }, [id, updateNodeData]);

  useEffect(() => {
    if (data.status !== "running") return;

    const tick = () => {
      const current = dataRef.current;
      if (
        current.status === "running" &&
        current.endsAt != null &&
        Date.now() >= current.endsAt
      ) {
        finish();
        return;
      }
      setDisplayMs(computeRemaining(current));
    };

    tick();
    const interval = window.setInterval(tick, TICK_MS);

    const onVisibility = () => {
      if (!document.hidden) tick();
    };
    const onFocus = () => tick();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [data.status, finish]);

  const start = useCallback(() => {
    const current = dataRef.current;
    initAudioContext();
    // A finished timer restarts from `targetMs`; otherwise resume the leftover.
    const effective =
      current.status === "finished"
        ? current.targetMs
        : computeRemaining(current);
    if (effective <= 0) return;
    updateNodeData(id, {
      status: "running",
      endsAt: Date.now() + effective,
      remainingMs: null,
    });
    setDisplayMs(effective);
  }, [id, updateNodeData]);

  const pause = useCallback(() => {
    const current = dataRef.current;
    if (current.status !== "running" || current.endsAt == null) return;
    const remaining = Math.max(0, current.endsAt - Date.now());
    updateNodeData(id, {
      status: "paused",
      endsAt: null,
      remainingMs: remaining,
    });
    setDisplayMs(remaining);
  }, [id, updateNodeData]);

  const reset = useCallback(() => {
    const current = dataRef.current;
    updateNodeData(id, {
      status: "idle",
      endsAt: null,
      remainingMs: null,
    });
    setDisplayMs(current.targetMs);
  }, [id, updateNodeData]);

  const setTarget = useCallback(
    (ms: number) => {
      const current = dataRef.current;
      if (current.status === "running") return;
      const clamped = Math.max(1000, Math.round(ms));
      const patch: Partial<TimerNodeData> = { targetMs: clamped };
      if (current.status === "paused") {
        patch.remainingMs = clamped;
      }
      updateNodeData(id, patch);
      setDisplayMs(clamped);
    },
    [id, updateNodeData],
  );

  return {
    status: data.status,
    displayMs,
    targetMs: data.targetMs,
    start,
    pause,
    reset,
    setTarget,
  };
}

/** Format ms as `MM:SS` (or `H:MM:SS` when ≥ 1h), ceiling to the next second. */
export function formatTimer(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const s = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const m = totalMin % 60;
  const h = Math.floor(totalMin / 60);
  const sStr = String(s).padStart(2, "0");
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${sStr}`;
  }
  return `${String(m).padStart(2, "0")}:${sStr}`;
}
