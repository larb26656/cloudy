import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import preview from "@/storybook/preview";
import { PomodoroNode } from "./PomodoroNode";
import type { PomodoroNodeData } from "./types";

const MS_MIN = 60_000;

const DEFAULT_SETTINGS = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
};

const IDLE: PomodoroNodeData = {
  settings: DEFAULT_SETTINGS,
  phase: "work",
  status: "idle",
  endsAt: null,
  remainingMs: null,
  completedWorkSessions: 0,
};

const RUNNING: PomodoroNodeData = {
  settings: DEFAULT_SETTINGS,
  phase: "work",
  status: "running",
  endsAt: Date.now() + 24.5 * MS_MIN,
  remainingMs: null,
  completedWorkSessions: 0,
};

const PAUSED: PomodoroNodeData = {
  settings: DEFAULT_SETTINGS,
  phase: "work",
  status: "paused",
  endsAt: null,
  remainingMs: 18.5 * MS_MIN,
  completedWorkSessions: 0,
};

const SHORT_BREAK: PomodoroNodeData = {
  settings: DEFAULT_SETTINGS,
  phase: "short-break",
  status: "running",
  endsAt: Date.now() + 4.5 * MS_MIN,
  remainingMs: null,
  completedWorkSessions: 1,
};

const LONG_BREAK: PomodoroNodeData = {
  settings: DEFAULT_SETTINGS,
  phase: "long-break",
  status: "running",
  endsAt: Date.now() + 14.5 * MS_MIN,
  remainingMs: null,
  completedWorkSessions: 4,
};

const CUSTOM_SETTINGS: PomodoroNodeData = {
  settings: {
    workMinutes: 50,
    shortBreakMinutes: 10,
    longBreakMinutes: 30,
    sessionsBeforeLongBreak: 2,
  },
  phase: "work",
  status: "idle",
  endsAt: null,
  remainingMs: null,
  completedWorkSessions: 0,
};

function PomodoroStory({ initialData }: { initialData: PomodoroNodeData }) {
  const [nodes, , onNodesChange] = useNodesState<Node>([
    {
      id: "pomo",
      type: "pomodoro",
      position: { x: 0, y: 0 },
      data: initialData,
      style: { width: 280, height: 360 },
    },
  ]);

  return (
    <div style={{ width: 360, height: 460 }}>
      <ReactFlow
        nodes={nodes}
        edges={[]}
        onNodesChange={onNodesChange}
        nodeTypes={{ pomodoro: PomodoroNode }}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        panOnDrag={false}
        zoomOnScroll={false}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}

const meta = preview.meta({
  title: "Desk/Nodes/PomodoroNode",
  component: PomodoroNode,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A pomodoro work/break cycle timer. Drag onto a desk canvas to use it. The stories below host a real React Flow node, so Start / Pause / Skip / Reset and the settings gear are all interactive.",
      },
    },
  },
  decorators: [
    (Story) => (
      <ReactFlowProvider>
        <Story />
      </ReactFlowProvider>
    ),
  ],
});

export default meta;

export const Idle = meta.story({
  name: "Idle (Work)",
  render: () => <PomodoroStory initialData={IDLE} />,
});

export const Running = meta.story({
  name: "Running (Work)",
  render: () => <PomodoroStory initialData={RUNNING} />,
});

export const Paused = meta.story({
  name: "Paused",
  render: () => <PomodoroStory initialData={PAUSED} />,
});

export const ShortBreak = meta.story({
  name: "Short Break (green tint)",
  render: () => <PomodoroStory initialData={SHORT_BREAK} />,
});

export const LongBreak = meta.story({
  name: "Long Break (blue tint)",
  render: () => <PomodoroStory initialData={LONG_BREAK} />,
});

export const CustomSettings = meta.story({
  name: "Custom durations (50/10/30, cycle 2)",
  render: () => <PomodoroStory initialData={CUSTOM_SETTINGS} />,
});
