import { Hourglass } from "lucide-react";
import type { NodeTemplate } from "../../template";
import { TimerNode } from "./TimerNode";

const MS_MIN = 60_000;

export const timerNodeTemplate: NodeTemplate = {
  id: "timer",
  label: "Timer",
  icon: Hourglass,
  size: { width: 260, height: 320 },
  defaultData: {
    targetMs: 5 * MS_MIN,
    status: "idle",
    endsAt: null,
    remainingMs: null,
  },
  component: TimerNode,
};
