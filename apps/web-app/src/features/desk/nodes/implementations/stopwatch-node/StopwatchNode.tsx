import { useReactFlow } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WindowFrame } from "../WindowFrame";
import type { StopwatchNodeProps } from "./types";
import { formatStopwatch, useStopwatchEngine } from "./useStopwatchEngine";

export function StopwatchNode({
  data,
  id,
  selected,
}: NodeProps<StopwatchNodeProps>) {
  const { updateNodeData } = useReactFlow();
  const { displayMs, start, pause, reset } = useStopwatchEngine(
    id,
    data,
    updateNodeData,
  );

  return (
    <WindowFrame
      title="Stopwatch"
      nodeId={id}
      selected={selected}
      minWidth={200}
      minHeight={180}
      maxWidth={400}
      maxHeight={400}
    >
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        <span className="font-mono text-3xl tabular-nums text-foreground">
          {formatStopwatch(displayMs)}
        </span>
        <div className="flex items-center gap-2">
          {data.running ? (
            <Button size="sm" onClick={pause} className="gap-1">
              <Pause className="h-3.5 w-3.5" />
              Pause
            </Button>
          ) : (
            <Button size="sm" onClick={start} className="gap-1">
              <Play className="h-3.5 w-3.5" />
              {data.accumulatedMs > 0 ? "Resume" : "Start"}
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
