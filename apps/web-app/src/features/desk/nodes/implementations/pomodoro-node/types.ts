import type { Node } from "@xyflow/react";

export type PomodoroPhase = "work" | "short-break" | "long-break";
export type PomodoroStatus = "idle" | "running" | "paused";

export type PomodoroSettings = {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
};

export type PomodoroNodeData = {
  settings: PomodoroSettings;
  phase: PomodoroPhase;
  status: PomodoroStatus;
  endsAt: number | null;
  remainingMs: number | null;
  completedWorkSessions: number;
};

export type PomodoroNodeProps = Node<PomodoroNodeData, "pomodoro">;
