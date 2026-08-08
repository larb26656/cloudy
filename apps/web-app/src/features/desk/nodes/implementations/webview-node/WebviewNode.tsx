import { ExternalLink } from "lucide-react";
import { useCallback } from "react";
import type { Node, NodeProps } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { WebviewFrame } from "@/components/webview";
import { useTabStore } from "@/stores/tabStore";
import { useDeleteNode } from "../useDeleteNode";
import { WindowFrame } from "../WindowFrame";

type WebviewNodeProps = Node<{ url: string }, "webview">;

export function WebviewNode({
  data,
  id,
  selected,
}: NodeProps<WebviewNodeProps>) {
  const { updateNodeData } = useReactFlow();
  const addTab = useTabStore((s) => s.addTab);
  const deleteNode = useDeleteNode(id);

  const handleUrlChange = useCallback(
    (url: string) => {
      updateNodeData(id, { url });
    },
    [id, updateNodeData],
  );

  const handleOpenInTab = useCallback(() => {
    addTab("webview", { url: data.url });
  }, [addTab, data.url]);

  const title = (() => {
    try {
      return new URL(data.url).hostname;
    } catch {
      return data.url || "Webview";
    }
  })();

  return (
    <WindowFrame
      title={title}
      nodeId={id}
      selected={selected}
      minWidth={320}
      minHeight={240}
      maxWidth={1200}
      maxHeight={900}
      onCloseOverride={deleteNode}
      actions={[
        {
          icon: ExternalLink,
          label: "Open in tab",
          onClick: handleOpenInTab,
        },
      ]}
    >
      <WebviewFrame
        url={data.url}
        onUrlChange={handleUrlChange}
        className="h-full"
      />
    </WindowFrame>
  );
}
