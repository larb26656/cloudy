import { ExternalLink } from "lucide-react";
import type { Node, NodeProps } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import { TerminalView } from "@/components/terminal";
import { ErrorState } from "@/components/ui/error-state";
import { useTabStore } from "@/stores/tabStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { WindowFrame } from "../WindowFrame";
import { disposePty } from "@/features/home/tabs/implementations/terminal/meta";

type TerminalNodeProps = Node<
  {
    workspaceId: string;
    ptyId: string | null;
  },
  "terminal"
>;

export function TerminalNode({ data, id, selected }: NodeProps<TerminalNodeProps>) {
  const { updateNodeData, deleteElements } = useReactFlow();
  const addTab = useTabStore((s) => s.addTab);
  const workspace = useWorkspaceStore((s) =>
    s.getWorkspace(data.workspaceId),
  );
  const directory = workspace?.directory;

  const handlePtyChange = useCallback(
    (ptyId: string | null) => {
      updateNodeData(id, { ptyId });
    },
    [id, updateNodeData],
  );

  const handleOpenInTab = useCallback(() => {
    addTab("terminal", {
      ptyId: data.ptyId,
      workspaceId: data.workspaceId,
    });
    // Release ownership from the node so the tab takes over the live PTY
    // instead of spawning a new one.
    updateNodeData(id, { ptyId: null });
  }, [addTab, data.ptyId, data.workspaceId, id, updateNodeData]);

  const handleClose = useCallback(() => {
    if (directory) {
      void disposePty(data.ptyId, directory);
    }
    void deleteElements({ nodes: [{ id }] });
  }, [data.ptyId, directory, deleteElements, id]);

  return (
    <WindowFrame
      title="Terminal"
      nodeId={id}
      selected={selected}
      minWidth={300}
      minHeight={180}
      maxWidth={1200}
      maxHeight={900}
      workspaceId={data.workspaceId}
      onCloseOverride={handleClose}
      actions={[
        {
          icon: ExternalLink,
          label: "Open in tab",
          onClick: handleOpenInTab,
          disabled: !data.ptyId,
        },
      ]}
    >
      {directory ? (
        <TerminalView
          className="h-full w-full"
          directory={directory}
          ptyId={data.ptyId}
          onPtyChange={handlePtyChange}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <ErrorState message="Workspace not found" />
        </div>
      )}
    </WindowFrame>
  );
}

