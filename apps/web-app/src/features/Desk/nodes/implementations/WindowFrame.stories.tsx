import { useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Bell, Copy, Maximize2, Settings, Star } from "lucide-react";
import preview from "@/storybook/preview";
import { useWorkspaceStore, WORKSPACE_COLORS } from "@/stores/workspaceStore";
import type { WindowFrameAction } from "./WindowFrame";
import { WindowFrame } from "./WindowFrame";

const meta = preview.meta({
  title: "Desk/WindowFrame",
  component: WindowFrame,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <ReactFlowProvider>
        <div
          className="relative rounded bg-muted/30 border border-border"
          style={{ width: 440, height: 320 }}
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
    <WindowFrame nodeId="story-node" title="Chat">
      <p className="p-4 text-sm text-muted-foreground">
        This is the body of a windowed desk node. The header bar is draggable
        and the close button is always available.
      </p>
    </WindowFrame>
  ),
});

export const Selected = meta.story({
  render: () => (
    <WindowFrame nodeId="story-node" title="Selected Node" selected>
      <p className="p-4 text-sm text-muted-foreground">
        While selected, the corner and edge resize handles appear around the
        frame.
      </p>
    </WindowFrame>
  ),
});

export const NoTitle = meta.story({
  render: () => (
    <WindowFrame nodeId="story-node">
      <p className="p-4 text-sm text-muted-foreground">
        A frame without a title — the header bar still hosts actions and the
        close button.
      </p>
    </WindowFrame>
  ),
});

export const WithActions = meta.story({
  render: () => {
    const actions: WindowFrameAction[] = [
      { icon: Settings, label: "Settings", onClick: () => {} },
      { icon: Copy, label: "Duplicate", onClick: () => {} },
      { icon: Maximize2, label: "Expand", onClick: () => {} },
      { icon: Bell, label: "Disabled action", onClick: () => {}, disabled: true },
    ];
    return (
      <WindowFrame nodeId="story-node" title="Actions" actions={actions}>
        <p className="p-4 text-sm text-muted-foreground">
          Header actions render left-to-right before the close button. A
          disabled action is shown last.
        </p>
      </WindowFrame>
    );
  },
});

export const WithHeaderAction = meta.story({
  render: () => (
    <WindowFrame
      nodeId="story-node"
      title="Notes"
      headerAction={
        <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
          <Star className="h-3 w-3" />
          Pinned
        </span>
      }
    >
      <p className="p-4 text-sm text-muted-foreground">
        Arbitrary React (a badge here) can be prepended to the title via{" "}
        <code>headerAction</code>.
      </p>
    </WindowFrame>
  ),
});

export const CustomColor = meta.story({
  render: () => (
    <WindowFrame
      nodeId="story-node"
      title="Themed Window"
      color="bg-blue-500/10"
      headerClassName="bg-blue-500/20 text-blue-900 dark:text-blue-100"
    >
      <p className="p-4 text-sm text-muted-foreground">
        Pass Tailwind classes through <code>color</code> and{" "}
        <code>headerClassName</code> to theme the frame.
      </p>
    </WindowFrame>
  ),
});

export const LongTitle = meta.story({
  render: () => (
    <WindowFrame nodeId="story-node" title="A very long window title that should truncate gracefully">
      <p className="p-4 text-sm text-muted-foreground">
        The title uses <code>truncate</code> so it never pushes the action
        buttons out of the header.
      </p>
    </WindowFrame>
  ),
});

function WorkspaceStorySetup({
  children,
}: {
  children: (workspaceId: string) => React.ReactNode;
}) {
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    if (workspaces.length > 0) {
      setId(workspaces[0].id);
      return;
    }
    const result = createWorkspace({
      instanceId: "storybook",
      name: "Personal",
      color: WORKSPACE_COLORS[0],
      directory: "/storybook/personal",
    });
    if (result.success) setId(result.data.id);
  }, [createWorkspace, workspaces]);

  if (!id) return null;
  return <>{children(id)}</>;
}

export const WithWorkspaceDot = meta.story({
  render: () => (
    <WorkspaceStorySetup>
      {(workspaceId) => (
        <WindowFrame nodeId="story-node" title="Workspace Node" workspaceId={workspaceId}>
          <p className="p-4 text-sm text-muted-foreground">
            A colored dot representing the node&apos;s workspace is shown next
            to the title.
          </p>
        </WindowFrame>
      )}
    </WorkspaceStorySetup>
  ),
});
