import { useReactFlow } from "@xyflow/react";
import type { Node } from "@xyflow/react";
import { useCallback } from "react";
import {
  ALIGN_OPS,
  DISTRIBUTE_OPS,
  type AlignType,
  type DistributeAxis,
  type PositionPatch,
} from "../utils/selectionOps";

interface UseDeskSelectionActionsArgs {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}

/**
 * Centralizes the operations that act on the currently-selected desk nodes
 * (duplicate, delete, align, distribute) so the floating toolbar and the
 * keyboard shortcuts share one source of truth.
 *
 * Reads the live `nodes` array (passed in) to discover the selection, and
 * writes through the local `setNodes` — keeping the controlled React Flow
 * state as the single source of truth. Node deletion goes through React
 * Flow's `deleteElements` so it emits the same remove-changes the per-node
 * close buttons already use.
 */
export function useDeskSelectionActions({
  nodes,
  setNodes,
}: UseDeskSelectionActionsArgs) {
  const { deleteElements } = useReactFlow();

  const getSelected = useCallback(
    () => nodes.filter((n) => n.selected),
    [nodes],
  );

  const applyPatches = useCallback(
    (patches: PositionPatch[]) => {
      if (patches.length === 0) return;
      const map = new Map(patches.map((p) => [p.id, p.position]));
      setNodes((nds) =>
        nds.map((node) => {
          const pos = map.get(node.id);
          return pos ? { ...node, position: pos } : node;
        }),
      );
    },
    [setNodes],
  );

  const duplicate = useCallback(() => {
    const selected = getSelected();
    if (selected.length === 0) return;

    setNodes((nds) => nds.map((node) => ({ ...node, selected: false })));

    const newNodes: Node[] = selected.map((node) => ({
      ...node,
      id: `node-${Date.now()}-${Math.random()}`,
      position: { x: node.position.x + 20, y: node.position.y + 20 },
      selected: true,
    }));

    setNodes((nds) => [...nds, ...newNodes]);
  }, [getSelected, setNodes]);

  const deleteAll = useCallback(() => {
    const selected = getSelected();
    if (selected.length === 0) return;
    deleteElements({ nodes: selected.map((n) => ({ id: n.id })) });
  }, [getSelected, deleteElements]);

  const align = useCallback(
    (type: AlignType) => {
      applyPatches(ALIGN_OPS[type](getSelected()));
    },
    [applyPatches, getSelected],
  );

  const distribute = useCallback(
    (axis: DistributeAxis) => {
      applyPatches(DISTRIBUTE_OPS[axis](getSelected()));
    },
    [applyPatches, getSelected],
  );

  return { duplicate, deleteAll, align, distribute };
}
