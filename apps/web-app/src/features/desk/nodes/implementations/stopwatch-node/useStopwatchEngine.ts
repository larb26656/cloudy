import { useCallback, useEffect, useRef, useState } from "react";
import type { StopwatchNodeData } from "./types";

const TICK_MS = 50;

export function computeElapsed(data: StopwatchNodeData): number {
  if (data.running && data.startedAt != null) {
    return Math.max(0, data.accumulatedMs + (Date.now() - data.startedAt));
  }
  return Math.max(0, data.accumulatedMs);
}

export function formatStopwatch(ms: number): string {
  const totalMs = Math.max(0, ms);
  const cs = Math.floor((totalMs % 1000) / 10);
  const totalSec = Math.floor(totalMs / 1000);
  const s = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const m = totalMin % 60;
  const h = Math.floor(totalMin / 60);
  const csStr = String(cs).padStart(2, "0");
  const sStr = String(s).padStart(2, "0");
  if (h > 0) {
    const mStr = String(m).padStart(2, "0");
    return `${h}:${mStr}:${sStr}.${csStr}`;
  }
  return `${String(m).padStart(2, "0")}:${sStr}.${csStr}`;
}

export type StopwatchEngine = {
  displayMs: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
};

export function useStopwatchEngine(
  id: string,
  data: StopwatchNodeData,
  updateNodeData: (id: string, patch: Partial<StopwatchNodeData>) => void,
): StopwatchEngine {
  const [displayMs, setDisplayMs] = useState<number>(() =>
    computeElapsed(data),
  );

  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (!data.running) return;
    const interval = window.setInterval(() => {
      setDisplayMs(computeElapsed(dataRef.current));
    }, TICK_MS);
    return () => window.clearInterval(interval);
  }, [data.running]);

  const start = useCallback(() => {
    const now = Date.now();
    updateNodeData(id, { running: true, startedAt: now });
    setDisplayMs(
      computeElapsed({ ...dataRef.current, running: true, startedAt: now }),
    );
  }, [id, updateNodeData]);

  const pause = useCallback(() => {
    const current = dataRef.current;
    if (!current.running || current.startedAt == null) return;
    const accumulatedMs =
      current.accumulatedMs + (Date.now() - current.startedAt);
    updateNodeData(id, { running: false, accumulatedMs, startedAt: null });
    setDisplayMs(accumulatedMs);
  }, [id, updateNodeData]);

  const reset = useCallback(() => {
    updateNodeData(id, { running: false, accumulatedMs: 0, startedAt: null });
    setDisplayMs(0);
  }, [id, updateNodeData]);

  return { displayMs, start, pause, reset };
}
