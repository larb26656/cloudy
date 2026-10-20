import type { Node, NodeProps } from "@xyflow/react";
import { Activity } from "lucide-react";
import { GlobalEventViewer } from "@/features/global-events/GlobalEventViewer";
import { WindowFrame } from "../WindowFrame";

type GlobalEventNodeProps = Node<Record<string, never>, "global-event">;

export function GlobalEventNode({
  id,
  selected,
}: NodeProps<GlobalEventNodeProps>) {
  return (
    <WindowFrame
      title="Global Events"
      nodeId={id}
      selected={selected}
      minWidth={280}
      minHeight={180}
      maxWidth={1000}
      maxHeight={800}
      headerAction={<Activity className="size-4" />}
      className="shadow-none"
    >
      <GlobalEventViewer />
    </WindowFrame>
  );
}
