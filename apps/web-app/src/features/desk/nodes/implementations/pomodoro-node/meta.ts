import { AlarmClock } from "lucide-react";
import type { NodeTemplate } from "../../template";
import { PomodoroNode } from "./PomodoroNode";

export const pomodoroNodeTemplate: NodeTemplate = {
  id: "pomodoro",
  label: "Pomodoro Timer",
  icon: AlarmClock,
  size: { width: 280, height: 360 },
  defaultData: {
    settings: {
      workMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      sessionsBeforeLongBreak: 4,
    },
    phase: "work",
    status: "idle",
    endsAt: null,
    remainingMs: null,
    completedWorkSessions: 0,
  },
  component: PomodoroNode,
};
