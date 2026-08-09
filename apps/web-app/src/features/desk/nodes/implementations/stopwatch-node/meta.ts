import { Timer } from "lucide-react";
import type { NodeTemplate } from "../../template";
import { StopwatchNode } from "./StopwatchNode";

export const stopwatchNodeTemplate: NodeTemplate = {
  id: "stopwatch",
  label: "Stopwatch",
  icon: Timer,
  size: { width: 240, height: 200 },
  defaultData: { accumulatedMs: 0, running: false, startedAt: null },
  component: StopwatchNode,
};
