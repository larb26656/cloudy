import type { Node } from "@xyflow/react";

/**
 * A node reduced to the geometry needed for align/distribute math.
 * `measured` is preferred (set by React Flow after render); we fall back to
 * the static `width`/`height` and finally to 0.
 */
type GeometricNode = Pick<
  Node,
  "id" | "position" | "measured" | "width" | "height"
>;

/** A position update to apply back to a node by id. */
export interface PositionPatch {
  id: string;
  position: { x: number; y: number };
}

interface NodeBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function toBox(node: GeometricNode): NodeBox {
  const mw = node.measured?.width;
  const mh = node.measured?.height;
  const w =
    typeof mw === "number"
      ? mw
      : typeof node.width === "number"
        ? node.width
        : 0;
  const h =
    typeof mh === "number"
      ? mh
      : typeof node.height === "number"
        ? node.height
        : 0;
  return { id: node.id, x: node.position.x, y: node.position.y, w, h };
}

function boxes(nodes: GeometricNode[]): NodeBox[] {
  return nodes.map(toBox);
}

export function alignLeft(nodes: GeometricNode[]): PositionPatch[] {
  if (nodes.length === 0) return [];
  const bs = boxes(nodes);
  const target = Math.min(...bs.map((b) => b.x));
  return bs.map((b) => ({ id: b.id, position: { x: target, y: b.y } }));
}

export function alignRight(nodes: GeometricNode[]): PositionPatch[] {
  if (nodes.length === 0) return [];
  const bs = boxes(nodes);
  const target = Math.max(...bs.map((b) => b.x + b.w));
  return bs.map((b) => ({ id: b.id, position: { x: target - b.w, y: b.y } }));
}

export function alignCenterH(nodes: GeometricNode[]): PositionPatch[] {
  if (nodes.length === 0) return [];
  const bs = boxes(nodes);
  const lefts = bs.map((b) => b.x);
  const rights = bs.map((b) => b.x + b.w);
  const center = (Math.min(...lefts) + Math.max(...rights)) / 2;
  return bs.map((b) => ({
    id: b.id,
    position: { x: center - b.w / 2, y: b.y },
  }));
}

export function alignTop(nodes: GeometricNode[]): PositionPatch[] {
  if (nodes.length === 0) return [];
  const bs = boxes(nodes);
  const target = Math.min(...bs.map((b) => b.y));
  return bs.map((b) => ({ id: b.id, position: { x: b.x, y: target } }));
}

export function alignBottom(nodes: GeometricNode[]): PositionPatch[] {
  if (nodes.length === 0) return [];
  const bs = boxes(nodes);
  const target = Math.max(...bs.map((b) => b.y + b.h));
  return bs.map((b) => ({
    id: b.id,
    position: { x: b.x, y: target - b.h },
  }));
}

export function alignCenterV(nodes: GeometricNode[]): PositionPatch[] {
  if (nodes.length === 0) return [];
  const bs = boxes(nodes);
  const tops = bs.map((b) => b.y);
  const bottoms = bs.map((b) => b.y + b.h);
  const center = (Math.min(...tops) + Math.max(...bottoms)) / 2;
  return bs.map((b) => ({
    id: b.id,
    position: { x: b.x, y: center - b.h / 2 },
  }));
}

/**
 * Distribute nodes with equal horizontal gaps between them.
 * Sorts by left edge, keeps the outermost edges fixed, and spaces the gaps
 * evenly. Requires at least 3 nodes to be meaningful (2 nodes already have a
 * single, trivially-"even" gap).
 */
export function distributeHorizontal(nodes: GeometricNode[]): PositionPatch[] {
  if (nodes.length < 3) return [];
  const sorted = boxes(nodes).sort(
    (a, b) => a.x - b.x || a.x + a.w / 2 - (b.x + b.w / 2),
  );
  const minLeft = sorted[0]!.x;
  const maxRight = Math.max(...sorted.map((b) => b.x + b.w));
  const totalSpan = maxRight - minLeft;
  const totalWidth = sorted.reduce((sum, b) => sum + b.w, 0);
  const gap = (totalSpan - totalWidth) / (sorted.length - 1);

  const patches: PositionPatch[] = [];
  let cursor = minLeft;
  for (const b of sorted) {
    patches.push({ id: b.id, position: { x: cursor, y: b.y } });
    cursor += b.w + gap;
  }
  return patches;
}

/**
 * Distribute nodes with equal vertical gaps between them.
 * @see distributeHorizontal
 */
export function distributeVertical(nodes: GeometricNode[]): PositionPatch[] {
  if (nodes.length < 3) return [];
  const sorted = boxes(nodes).sort(
    (a, b) => a.y - b.y || a.y + a.h / 2 - (b.y + b.h / 2),
  );
  const minTop = sorted[0]!.y;
  const maxBottom = Math.max(...sorted.map((b) => b.y + b.h));
  const totalSpan = maxBottom - minTop;
  const totalHeight = sorted.reduce((sum, b) => sum + b.h, 0);
  const gap = (totalSpan - totalHeight) / (sorted.length - 1);

  const patches: PositionPatch[] = [];
  let cursor = minTop;
  for (const b of sorted) {
    patches.push({ id: b.id, position: { x: b.x, y: cursor } });
    cursor += b.h + gap;
  }
  return patches;
}

export type AlignType =
  | "left"
  | "right"
  | "centerH"
  | "top"
  | "bottom"
  | "centerV";

export type DistributeAxis = "horizontal" | "vertical";

export const ALIGN_OPS: Record<
  AlignType,
  (nodes: GeometricNode[]) => PositionPatch[]
> = {
  left: alignLeft,
  right: alignRight,
  centerH: alignCenterH,
  top: alignTop,
  bottom: alignBottom,
  centerV: alignCenterV,
};

export const DISTRIBUTE_OPS: Record<
  DistributeAxis,
  (nodes: GeometricNode[]) => PositionPatch[]
> = {
  horizontal: distributeHorizontal,
  vertical: distributeVertical,
};
