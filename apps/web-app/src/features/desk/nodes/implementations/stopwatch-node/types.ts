import type { Node } from "@xyflow/react";

export type StopwatchNodeData = {
  accumulatedMs: number;
  running: boolean;
  startedAt: number | null;
};

export type StopwatchNodeProps = Node<StopwatchNodeData, "stopwatch">;
