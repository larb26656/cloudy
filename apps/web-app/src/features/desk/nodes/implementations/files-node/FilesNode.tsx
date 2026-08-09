import { ExternalLink } from "lucide-react";
import { useCallback } from "react";
import type { Node, NodeProps } from "@xyflow/react";
import { FilesContainer } from "@/components/files/FilesContainer";
import { ErrorState } from "@/components/ui/error-state";
import { Center } from "@/components/layout";
import { useTabStore } from "@/stores/tabStore";
import { useWorkspace } from "@/hooks/queries";
import { WindowFrame } from "../WindowFrame";

type FilesNodeProps = Node<
  {
    workspaceId: string;
    directory: string;
  },
  "files-node"
>;

export function FilesNode({ data, id, selected }: NodeProps<FilesNodeProps>) {
  const addTab = useTabStore((s) => s.addTab);
  const { data: workspace } = useWorkspace(data.workspaceId);

  const directory = workspace?.directory ?? data.directory;
  const title = workspace?.name ?? "Files";

  const handleOpenInTab = useCallback(() => {
    addTab("files", {
      workspaceId: data.workspaceId,
      directory,
    });
  }, [addTab, data.workspaceId, directory]);

  return (
    <WindowFrame
      title={title}
      nodeId={id}
      selected={selected}
      minWidth={500}
      minHeight={300}
      maxWidth={1600}
      maxHeight={1000}
      workspaceId={data.workspaceId}
      actions={[
        {
          icon: ExternalLink,
          label: "Open in tab",
          onClick: handleOpenInTab,
        },
      ]}
    >
      {directory ? (
        <FilesContainer directory={directory} />
      ) : (
        <Center className="flex-1">
          <ErrorState message="Workspace not found" />
        </Center>
      )}
    </WindowFrame>
  );
}
