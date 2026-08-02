import { ExternalLink } from "lucide-react";
import { useCallback } from "react";
import type { Node, NodeProps } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { TerminalView } from "@/components/terminal";
import { ErrorState } from "@/components/ui/error-state";
import { useTabStore } from "@/stores/tabStore";
import { useWorkspace } from "@/hooks/queries";
import { useKillPtySession } from "@/hooks/queries";
import { useDeleteNode } from "../useDeleteNode";
import { WindowFrame } from "../WindowFrame";

type TerminalNodeProps = Node<
  {
    workspaceId: string;
    directory: string;
    ptyId: string | null;
  },
  "terminal"
>;

export function TerminalNode({
  data,
  id,
  selected,
}: NodeProps<TerminalNodeProps>) {
  const { updateNodeData } = useReactFlow();
  const addTab = useTabStore((s) => s.addTab);
  const killPty = useKillPtySession();
  const deleteNode = useDeleteNode(id);
  const { data: workspace } = useWorkspace(data.workspaceId);

  const directory = workspace?.directory ?? data.directory;
  const title = workspace?.name ?? "Terminal";

  const handlePtyChange = useCallback(
    (ptyId: string | null) => {
      updateNodeData(id, { ptyId });
    },
    [id, updateNodeData],
  );

  const handleOpenInTab = useCallback(() => {
    addTab("terminal", {
      workspaceId: data.workspaceId,
      directory,
      ptyId: data.ptyId,
    });
  }, [addTab, data.workspaceId, data.ptyId, directory]);

  const handleClose = useCallback(() => {
    if (data.ptyId) {
      void killPty.mutateAsync({ id: data.ptyId }).catch(() => {});
    }
    deleteNode();
  }, [data.ptyId, deleteNode, killPty]);

  return (
    <WindowFrame
      title={title}
      nodeId={id}
      selected={selected}
      minWidth={400}
      minHeight={250}
      maxWidth={900}
      maxHeight={700}
      workspaceId={data.workspaceId}
      onCloseOverride={handleClose}
      actions={[
        {
          icon: ExternalLink,
          label: "Open in tab",
          onClick: handleOpenInTab,
        },
      ]}
    >
      {directory ? (
        <TerminalView
          directory={directory}
          ptyId={data.ptyId}
          onPtyChange={handlePtyChange}
          className="h-full w-full"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <ErrorState message="Workspace not found" />
        </div>
      )}
    </WindowFrame>
  );
}
