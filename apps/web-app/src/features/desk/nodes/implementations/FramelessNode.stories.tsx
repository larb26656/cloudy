import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import preview from "@/storybook/preview";
import { FramelessNode } from "./FramelessNode";

const meta = preview.meta({
  title: "Desk/FramelessNode",
  component: FramelessNode,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <ReactFlowProvider>
        <div
          className="relative rounded bg-muted/30 border border-border"
          style={{ width: 400, height: 260 }}
        >
          <Story />
        </div>
      </ReactFlowProvider>
    ),
  ],
});

export default meta;

export const Default = meta.story({
  render: () => (
    <FramelessNode>
      <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
        Unselected: no background, no border, no title bar — just content.
      </div>
    </FramelessNode>
  ),
});

export const Selected = meta.story({
  render: () => (
    <FramelessNode selected>
      <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
        While selected, a border appears around the node. There is no title bar
        — the content itself is the drag handle. Delete via Backspace / Delete
        key or the canvas SelectionToolbar.
      </div>
    </FramelessNode>
  ),
});

export const CustomColor = meta.story({
  render: () => (
    <FramelessNode color="bg-violet-500/10">
      <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
        Theme the surface with a Tailwind class via <code>color</code>.
      </div>
    </FramelessNode>
  ),
});

export const RichContent = meta.story({
  render: () => (
    <FramelessNode>
      <div className="flex h-full flex-col gap-3 p-4">
        <div className="h-20 w-full rounded bg-gradient-to-br from-primary/40 to-primary/10" />
        <div className="space-y-2">
          <div className="h-3 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted" />
        </div>
      </div>
    </FramelessNode>
  ),
});
