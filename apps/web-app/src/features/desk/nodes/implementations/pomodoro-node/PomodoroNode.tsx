import { useReactFlow } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { Pause, Play, RotateCcw, Settings, SkipForward } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WindowFrame } from "../WindowFrame";
import { usePomodoroEngine } from "./usePomodoroEngine";
import type {
  PomodoroNodeProps,
  PomodoroPhase,
  PomodoroSettings,
} from "./types";

const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatMmSs(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const PHASE_LABELS: Record<PomodoroPhase, string> = {
  work: "Work",
  "short-break": "Short Break",
  "long-break": "Long Break",
};

const PHASE_TINTS: Record<PomodoroPhase, string> = {
  work: "",
  "short-break": "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200",
  "long-break": "bg-blue-50 dark:bg-blue-950/30 border-blue-200",
};

function SettingsGear({
  settings,
  disabled,
  onApply,
}: {
  settings: PomodoroSettings;
  disabled: boolean;
  onApply: (settings: PomodoroSettings) => void;
}) {
  const [open, setOpen] = useState(false);
  const [work, setWork] = useState(String(settings.workMinutes));
  const [shortBreak, setShortBreak] = useState(
    String(settings.shortBreakMinutes),
  );
  const [longBreak, setLongBreak] = useState(String(settings.longBreakMinutes));
  const [sessions, setSessions] = useState(
    String(settings.sessionsBeforeLongBreak),
  );

  useEffect(() => {
    if (open) {
      setWork(String(settings.workMinutes));
      setShortBreak(String(settings.shortBreakMinutes));
      setLongBreak(String(settings.longBreakMinutes));
      setSessions(String(settings.sessionsBeforeLongBreak));
    }
  }, [open, settings]);

  const handleApply = () => {
    onApply({
      workMinutes: Math.max(1, Number(work) || 1),
      shortBreakMinutes: Math.max(1, Number(shortBreak) || 1),
      longBreakMinutes: Math.max(1, Number(longBreak) || 1),
      sessionsBeforeLongBreak: Math.max(1, Number(sessions) || 1),
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        title={disabled ? "Pause to change settings" : "Settings"}
        className="rounded p-1 hover:bg-muted-foreground/20 disabled:pointer-events-none disabled:opacity-50"
      >
        <Settings className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-3">
        <div className="space-y-2">
          <label className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">Work (min)</span>
            <Input
              type="number"
              min={1}
              value={work}
              onChange={(e) => setWork(e.target.value)}
              className="h-7 w-16"
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">Short break (min)</span>
            <Input
              type="number"
              min={1}
              value={shortBreak}
              onChange={(e) => setShortBreak(e.target.value)}
              className="h-7 w-16"
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">Long break (min)</span>
            <Input
              type="number"
              min={1}
              value={longBreak}
              onChange={(e) => setLongBreak(e.target.value)}
              className="h-7 w-16"
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">Sessions / cycle</span>
            <Input
              type="number"
              min={1}
              value={sessions}
              onChange={(e) => setSessions(e.target.value)}
              className="h-7 w-16"
            />
          </label>
          <Button size="sm" className="w-full" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function PomodoroNode({
  data,
  id,
  selected,
}: NodeProps<PomodoroNodeProps>) {
  const { updateNodeData } = useReactFlow();
  const {
    phase,
    status,
    displayMs,
    totalMs,
    completedWorkSessions,
    start,
    pause,
    skip,
    reset,
    updateSettings,
  } = usePomodoroEngine(id, data, updateNodeData);

  const ratio = totalMs > 0 ? Math.min(1, Math.max(0, displayMs / totalMs)) : 0;
  const offset = RING_CIRCUMFERENCE * (1 - ratio);
  const sessionsLabel =
    completedWorkSessions === 1
      ? "1 pomodoro done"
      : `${completedWorkSessions} pomodoros done`;

  return (
    <WindowFrame
      title="Pomodoro"
      nodeId={id}
      selected={selected}
      minWidth={240}
      minHeight={300}
      maxWidth={400}
      maxHeight={500}
      color={PHASE_TINTS[phase]}
      headerAction={
        <SettingsGear
          settings={data.settings}
          disabled={status === "running"}
          onApply={updateSettings}
        />
      }
    >
      <div className="flex h-full flex-col items-center justify-between gap-3 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {PHASE_LABELS[phase]}
        </div>

        <div className="relative flex h-32 w-32 items-center justify-center">
          <svg
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r={RING_RADIUS}
              fill="none"
              strokeWidth="6"
              stroke="currentColor"
              className="text-muted-foreground/20"
            />
            <circle
              cx="50"
              cy="50"
              r={RING_RADIUS}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={offset}
              stroke="currentColor"
              className="text-foreground transition-[stroke-dashoffset] duration-200 ease-linear"
            />
          </svg>
          <span className="relative font-mono text-3xl tabular-nums text-foreground">
            {formatMmSs(displayMs)}
          </span>
        </div>

        <div className="text-xs text-muted-foreground">{sessionsLabel}</div>

        <div className="flex items-center gap-2">
          {status === "running" ? (
            <Button size="sm" onClick={pause} className="gap-1">
              <Pause className="h-3.5 w-3.5" />
              Pause
            </Button>
          ) : (
            <Button size="sm" onClick={start} className="gap-1">
              <Play className="h-3.5 w-3.5" />
              {status === "paused" ? "Resume" : "Start"}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={skip}
            disabled={status === "idle"}
            className="gap-1"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Skip
          </Button>
          <Button size="sm" variant="outline" onClick={reset} className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>
    </WindowFrame>
  );
}
