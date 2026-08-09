import type { Node } from "@xyflow/react";

export type TimerStatus = "idle" | "running" | "paused" | "finished";

export type TimerNodeData = {
  /** Total countdown duration the user set, in ms. */
  targetMs: number;
  status: TimerStatus;
  /** Wall-clock deadline while `status === "running"`. */
  endsAt: number | null;
  /** Remaining ms cached while `status === "paused"`. */
  remainingMs: number | null;
};

export type TimerNodeProps = Node<TimerNodeData, "timer">;
