import { ExternalLink } from "lucide-react";
import { useCallback } from "react";
import type { Node, NodeProps } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { TerminalView } from "@/components/terminal";
import { ErrorState } from "@/components/ui/error-state";
import { Center } from "@/components/layout";
import { useTabStore } from "@/stores/tabStore";
import {
  useKillPtySession,
  usePtySession,
  useUpdatePtySession,
} from "@/hooks/queries";
import { useDeleteNode } from "../useDeleteNode";
import { WindowFrame } from "../WindowFrame";

type TerminalNodeProps = Node<
  {
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
  const updatePty = useUpdatePtySession();
  const deleteNode = useDeleteNode(id);
  const { data: session } = usePtySession(data.ptyId);

  const directory = data.directory;
  const title = session?.name ?? "Terminal";

  const handlePtyChange = useCallback(
    (ptyId: string | null) => {
      updateNodeData(id, { ptyId });
    },
    [id, updateNodeData],
  );

  const handleOpenInTab = useCallback(() => {
    addTab("terminal", {
      directory,
      ptyId: data.ptyId,
    });
  }, [addTab, data.ptyId, directory]);

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
      onCloseOverride={handleClose}
      onRename={
        data.ptyId
          ? (name) => updatePty.mutate({ id: data.ptyId!, name })
          : undefined
      }
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
        <Center className="flex-1">
          <ErrorState message="Workspace not found" />
        </Center>
      )}
    </WindowFrame>
  );
}
