import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import preview from "@/storybook/preview";
import { TimerNode } from "./TimerNode";
import type { TimerNodeData } from "./types";

const MS_MIN = 60_000;

const IDLE: TimerNodeData = {
  targetMs: 5 * MS_MIN,
  status: "idle",
  endsAt: null,
  remainingMs: null,
};

const RUNNING: TimerNodeData = {
  targetMs: 5 * MS_MIN,
  status: "running",
  endsAt: Date.now() + 4 * MS_MIN + 12_000,
  remainingMs: null,
};

const PAUSED: TimerNodeData = {
  targetMs: 5 * MS_MIN,
  status: "paused",
  endsAt: null,
  remainingMs: 2 * MS_MIN + 30_000,
};

const FINISHED: TimerNodeData = {
  targetMs: 5 * MS_MIN,
  status: "finished",
  endsAt: null,
  remainingMs: null,
};

const CUSTOM_TARGET: TimerNodeData = {
  targetMs: 25 * MS_MIN,
  status: "idle",
  endsAt: null,
  remainingMs: null,
};

const LONG_TARGET: TimerNodeData = {
  targetMs: 90 * MS_MIN,
  status: "idle",
  endsAt: null,
  remainingMs: null,
};

function TimerStory({ initialData }: { initialData: TimerNodeData }) {
  const [nodes, , onNodesChange] = useNodesState<Node>([
    {
      id: "timer",
      type: "timer",
      position: { x: 0, y: 0 },
      data: initialData,
      style: { width: 260, height: 320 },
    },
  ]);

  return (
    <div style={{ width: 360, height: 440 }}>
      <ReactFlow
        nodes={nodes}
        edges={[]}
        onNodesChange={onNodesChange}
        nodeTypes={{ timer: TimerNode }}
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
  title: "Desk/Nodes/TimerNode",
  component: TimerNode,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A one-shot countdown timer. Set minutes/seconds via the gear, hit Start, and it beeps three times when it reaches zero. The stories below host a real React Flow node, so Start / Pause / Reset and the settings gear are all interactive.",
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
  name: "Idle (5 min)",
  render: () => <TimerStory initialData={IDLE} />,
});

export const Running = meta.story({
  name: "Running (4:12 left)",
  render: () => <TimerStory initialData={RUNNING} />,
});

export const Paused = meta.story({
  name: "Paused (2:30 left)",
  render: () => <TimerStory initialData={PAUSED} />,
});

export const Finished = meta.story({
  name: "Finished (amber tint)",
  render: () => <TimerStory initialData={FINISHED} />,
});

export const CustomTarget = meta.story({
  name: "Custom target (25 min)",
  render: () => <TimerStory initialData={CUSTOM_TARGET} />,
});

export const LongTarget = meta.story({
  name: "Long target (1:30:00)",
  render: () => <TimerStory initialData={LONG_TARGET} />,
});
