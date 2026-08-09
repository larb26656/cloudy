import { useReactFlow } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { Pause, Play, RotateCcw, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WindowFrame } from "../WindowFrame";
import { formatTimer, useTimerEngine } from "./useTimerEngine";
import type { TimerNodeProps } from "./types";

const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const MS_MIN = 60_000;
const MS_SEC = 1000;

function TargetGear({
  targetMs,
  disabled,
  onApply,
}: {
  targetMs: number;
  disabled: boolean;
  onApply: (ms: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const initialMinutes = String(Math.floor(targetMs / MS_MIN));
  const initialSeconds = String(Math.floor((targetMs % MS_MIN) / MS_SEC));
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (open) {
      setMinutes(String(Math.floor(targetMs / MS_MIN)));
      setSeconds(String(Math.floor((targetMs % MS_MIN) / MS_SEC)));
    }
  }, [open, targetMs]);

  const handleApply = () => {
    const m = Math.max(0, Number(minutes) || 0);
    const s = Math.max(0, Number(seconds) || 0);
    onApply(m * MS_MIN + s * MS_SEC);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        title={disabled ? "Pause to change time" : "Set time"}
        className="rounded p-1 hover:bg-muted-foreground/20 disabled:pointer-events-none disabled:opacity-50"
      >
        <Settings className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <label className="flex flex-1 items-center justify-between gap-1">
              <span className="text-muted-foreground">Min</span>
              <Input
                type="number"
                min={0}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="h-7 w-16"
              />
            </label>
            <label className="flex flex-1 items-center justify-between gap-1">
              <span className="text-muted-foreground">Sec</span>
              <Input
                type="number"
                min={0}
                max={59}
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                className="h-7 w-16"
              />
            </label>
          </div>
          <Button size="sm" className="w-full" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function TimerNode({ data, id, selected }: NodeProps<TimerNodeProps>) {
  const { updateNodeData } = useReactFlow();
  const { status, displayMs, targetMs, start, pause, reset, setTarget } =
    useTimerEngine(id, data, updateNodeData);

  const ratio =
    targetMs > 0 ? Math.min(1, Math.max(0, displayMs / targetMs)) : 0;
  const offset = RING_CIRCUMFERENCE * (1 - ratio);
  const isFinished = status === "finished";
  const isRunning = status === "running";

  return (
    <WindowFrame
      title="Timer"
      nodeId={id}
      selected={selected}
      minWidth={240}
      minHeight={300}
      maxWidth={400}
      maxHeight={500}
      color={
        isFinished
          ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200"
          : undefined
      }
      headerAction={
        <TargetGear
          targetMs={targetMs}
          disabled={isRunning}
          onApply={setTarget}
        />
      }
    >
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
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
              className={
                isFinished
                  ? "text-amber-500"
                  : "text-foreground transition-[stroke-dashoffset] duration-200 ease-linear"
              }
            />
          </svg>
          <span className="relative font-mono text-3xl tabular-nums text-foreground">
            {formatTimer(displayMs)}
          </span>
        </div>

        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {isFinished ? "Done" : isRunning ? "Counting down" : "Ready"}
        </div>

        <div className="flex items-center gap-2">
          {isRunning ? (
            <Button size="sm" onClick={pause} className="gap-1">
              <Pause className="h-3.5 w-3.5" />
              Pause
            </Button>
          ) : (
            <Button size="sm" onClick={start} className="gap-1">
              <Play className="h-3.5 w-3.5" />
              {status === "paused"
                ? "Resume"
                : isFinished
                  ? "Restart"
                  : "Start"}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={reset} className="gap-1">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>
    </WindowFrame>
  );
}
