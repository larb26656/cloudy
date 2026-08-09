import { useCallback, useEffect, useRef, useState } from "react";
import { initAudioContext, playBeep } from "../../lib/audio";
import type {
  PomodoroNodeData,
  PomodoroPhase,
  PomodoroSettings,
  PomodoroStatus,
} from "./types";

const MS_PER_MINUTE = 60_000;
const TICK_MS = 250;

function phaseDurationMs(
  phase: PomodoroPhase,
  settings: PomodoroSettings,
): number {
  switch (phase) {
    case "work":
      return settings.workMinutes * MS_PER_MINUTE;
    case "short-break":
      return settings.shortBreakMinutes * MS_PER_MINUTE;
    case "long-break":
      return settings.longBreakMinutes * MS_PER_MINUTE;
  }
}

function computeRemaining(data: PomodoroNodeData): number {
  if (data.status === "running" && data.endsAt != null) {
    return Math.max(0, data.endsAt - Date.now());
  }
  if (data.status === "paused" && data.remainingMs != null) {
    return Math.max(0, data.remainingMs);
  }
  return phaseDurationMs(data.phase, data.settings);
}

type NextPhaseInfo = {
  phase: PomodoroPhase;
  durationMs: number;
  completedWorkSessions: number;
  beep: { times: number; freq: number };
};

function getNextPhaseInfo(data: PomodoroNodeData): NextPhaseInfo {
  if (data.phase === "work") {
    const newCount = data.completedWorkSessions + 1;
    const isLong =
      data.settings.sessionsBeforeLongBreak > 0 &&
      newCount % data.settings.sessionsBeforeLongBreak === 0;
    const nextPhase: PomodoroPhase = isLong ? "long-break" : "short-break";
    const durationMs =
      (isLong
        ? data.settings.longBreakMinutes
        : data.settings.shortBreakMinutes) * MS_PER_MINUTE;
    return {
      phase: nextPhase,
      durationMs,
      completedWorkSessions: newCount,
      beep: { times: 2, freq: 660 },
    };
  }
  return {
    phase: "work",
    durationMs: data.settings.workMinutes * MS_PER_MINUTE,
    completedWorkSessions: data.completedWorkSessions,
    beep: { times: 3, freq: 880 },
  };
}

export type PomodoroEngine = {
  phase: PomodoroPhase;
  status: PomodoroStatus;
  displayMs: number;
  totalMs: number;
  completedWorkSessions: number;
  start: () => void;
  pause: () => void;
  skip: () => void;
  reset: () => void;
  updateSettings: (settings: PomodoroSettings) => void;
};

export function usePomodoroEngine(
  id: string,
  data: PomodoroNodeData,
  updateNodeData: (id: string, patch: Partial<PomodoroNodeData>) => void,
): PomodoroEngine {
  const totalMs = phaseDurationMs(data.phase, data.settings);
  const [displayMs, setDisplayMs] = useState<number>(() =>
    computeRemaining(data),
  );

  const dataRef = useRef(data);
  dataRef.current = data;

  const processPhaseEnd = useCallback(() => {
    const current = dataRef.current;
    const next = getNextPhaseInfo(current);
    playBeep(next.beep.times, next.beep.freq);
    updateNodeData(id, {
      phase: next.phase,
      completedWorkSessions: next.completedWorkSessions,
      endsAt: Date.now() + next.durationMs,
      status: "running",
      remainingMs: null,
    });
    setDisplayMs(next.durationMs);
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
        processPhaseEnd();
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
  }, [data.status, processPhaseEnd]);

  const start = useCallback(() => {
    const current = dataRef.current;
    initAudioContext();
    const remaining = computeRemaining(current);
    updateNodeData(id, {
      status: "running",
      endsAt: Date.now() + remaining,
      remainingMs: null,
    });
    setDisplayMs(remaining);
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

  const skip = useCallback(() => {
    processPhaseEnd();
  }, [processPhaseEnd]);

  const reset = useCallback(() => {
    const current = dataRef.current;
    updateNodeData(id, {
      phase: "work",
      status: "idle",
      endsAt: null,
      remainingMs: null,
      completedWorkSessions: 0,
    });
    setDisplayMs(phaseDurationMs("work", current.settings));
  }, [id, updateNodeData]);

  const updateSettings = useCallback(
    (settings: PomodoroSettings) => {
      const current = dataRef.current;
      if (current.status === "running") return;
      const patch: Partial<PomodoroNodeData> = { settings };
      const newDisplay = phaseDurationMs(current.phase, settings);
      if (current.status === "paused") {
        patch.remainingMs = newDisplay;
      }
      updateNodeData(id, patch);
      setDisplayMs(newDisplay);
    },
    [id, updateNodeData],
  );

  return {
    phase: data.phase,
    status: data.status,
    displayMs,
    totalMs,
    completedWorkSessions: data.completedWorkSessions,
    start,
    pause,
    skip,
    reset,
    updateSettings,
  };
}
