import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import preview from "@/storybook/preview";
import { StopwatchNode } from "./StopwatchNode";
import type { StopwatchNodeData } from "./types";

const IDLE: StopwatchNodeData = {
  accumulatedMs: 0,
  running: false,
  startedAt: null,
};

const RUNNING: StopwatchNodeData = {
  accumulatedMs: 0,
  running: true,
  startedAt: Date.now() - 12_350,
};

const PAUSED: StopwatchNodeData = {
  accumulatedMs: 1_842_560,
  running: false,
  startedAt: null,
};

const OVER_AN_HOUR: StopwatchNodeData = {
  accumulatedMs: 0,
  running: true,
  startedAt: Date.now() - (3 * 60 * 60_000 + 5 * 60_000 + 42_300),
};

function StopwatchStory({ initialData }: { initialData: StopwatchNodeData }) {
  const [nodes, , onNodesChange] = useNodesState<Node>([
    {
      id: "stopwatch",
      type: "stopwatch",
      position: { x: 0, y: 0 },
      data: initialData,
      style: { width: 240, height: 200 },
    },
  ]);

  return (
    <div style={{ width: 320, height: 300 }}>
      <ReactFlow
        nodes={nodes}
        edges={[]}
        onNodesChange={onNodesChange}
        nodeTypes={{ stopwatch: StopwatchNode }}
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
  title: "Desk/Nodes/StopwatchNode",
  component: StopwatchNode,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A simple stopwatch for timing work. Drag onto a desk canvas to use it. The stories below host a real React Flow node, so Start / Pause / Reset are all interactive and the elapsed time persists across reloads via the node's data.",
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
  name: "Idle (00:00.00)",
  render: () => <StopwatchStory initialData={IDLE} />,
});

export const Running = meta.story({
  name: "Running",
  render: () => <StopwatchStory initialData={RUNNING} />,
});

export const Paused = meta.story({
  name: "Paused (30:42.56)",
  render: () => <StopwatchStory initialData={PAUSED} />,
});

export const OverAnHour = meta.story({
  name: "Over an hour (H:MM:SS.cs)",
  render: () => <StopwatchStory initialData={OVER_AN_HOUR} />,
});
