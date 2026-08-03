import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";

export function useDeleteNode(nodeId: string) {
  const { deleteElements } = useReactFlow();
  return useCallback(() => {
    deleteElements({ nodes: [{ id: nodeId }] });
  }, [deleteElements, nodeId]);
}
