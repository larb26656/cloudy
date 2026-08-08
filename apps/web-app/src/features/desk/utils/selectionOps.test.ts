import { describe, expect, it } from "vitest";
import type { Node } from "@xyflow/react";
import {
  alignBottom,
  alignCenterH,
  alignCenterV,
  alignLeft,
  alignRight,
  alignTop,
  distributeHorizontal,
  distributeVertical,
} from "./selectionOps";

/** Build a minimal geometric node. `measured` mimics React Flow's post-render sizing. */
function n(id: string, x: number, y: number, w: number, h: number): Node {
  return {
    id,
    position: { x, y },
    measured: { width: w, height: h },
    data: {},
  } as Node;
}

function posOf(
  patches: ReturnType<typeof alignLeft>,
): Record<string, { x: number; y: number }> {
  return Object.fromEntries(patches.map((p) => [p.id, p.position]));
}

describe("alignLeft", () => {
  it("snaps every node's left edge to the minimum left (y untouched)", () => {
    const patches = alignLeft([n("a", 10, 5, 30, 20), n("b", 50, 8, 40, 25)]);
    expect(posOf(patches)).toEqual({
      a: { x: 10, y: 5 },
      b: { x: 10, y: 8 },
    });
  });

  it("returns [] for empty input", () => {
    expect(alignLeft([])).toEqual([]);
  });
});

describe("alignRight", () => {
  it("snaps every node's right edge to the maximum right", () => {
    const patches = alignRight([n("a", 10, 5, 30, 20), n("b", 50, 8, 40, 25)]);
    // max right = max(40, 90) = 90
    expect(posOf(patches)).toEqual({
      a: { x: 60, y: 5 }, // 90 - 30
      b: { x: 50, y: 8 }, // 90 - 40
    });
  });
});

describe("alignCenterH", () => {
  it("centers all nodes on the selection bounding-box horizontal center", () => {
    const patches = alignCenterH([
      n("a", 0, 0, 20, 10),
      n("b", 100, 0, 40, 10),
    ]);
    // lefts: 0,100 -> min 0 ; rights: 20,140 -> max 140 ; center = 70
    expect(posOf(patches)).toEqual({
      a: { x: 60, y: 0 }, // 70 - 10
      b: { x: 50, y: 0 }, // 70 - 20
    });
  });
});

describe("alignTop", () => {
  it("snaps every node's top edge to the minimum top (x untouched)", () => {
    const patches = alignTop([n("a", 10, 5, 30, 20), n("b", 50, 8, 40, 25)]);
    expect(posOf(patches)).toEqual({
      a: { x: 10, y: 5 },
      b: { x: 50, y: 5 },
    });
  });
});

describe("alignBottom", () => {
  it("snaps every node's bottom edge to the maximum bottom", () => {
    const patches = alignBottom([n("a", 10, 5, 30, 20), n("b", 50, 8, 40, 25)]);
    // max bottom = max(25, 33) = 33
    expect(posOf(patches)).toEqual({
      a: { x: 10, y: 13 }, // 33 - 20
      b: { x: 50, y: 8 }, // 33 - 25
    });
  });
});

describe("alignCenterV", () => {
  it("centers all nodes on the selection bounding-box vertical center", () => {
    const patches = alignCenterV([
      n("a", 0, 0, 20, 10),
      n("b", 0, 100, 20, 30),
    ]);
    // tops: 0,100 -> min 0 ; bottoms: 10,130 -> max 130 ; center = 65
    expect(posOf(patches)).toEqual({
      a: { x: 0, y: 60 }, // 65 - 5
      b: { x: 0, y: 50 }, // 65 - 15
    });
  });
});

describe("distributeHorizontal", () => {
  it("returns [] for fewer than 3 nodes", () => {
    expect(distributeHorizontal([n("a", 0, 0, 10, 10)])).toEqual([]);
    expect(
      distributeHorizontal([n("a", 0, 0, 10, 10), n("b", 50, 0, 10, 10)]),
    ).toEqual([]);
  });

  it("keeps outermost edges fixed and equalizes gaps", () => {
    // three 10-wide nodes spanning left=0 .. right=100
    const patches = distributeHorizontal([
      n("a", 0, 0, 10, 10),
      n("b", 30, 0, 10, 10),
      n("c", 90, 0, 10, 10),
    ]);
    const ps = posOf(patches);
    // span 100, total width 30, gap = (100-30)/2 = 35
    expect(ps.a).toEqual({ x: 0, y: 0 });
    expect(ps.b).toEqual({ x: 45, y: 0 }); // 0 + 10 + 35
    expect(ps.c).toEqual({ x: 90, y: 0 }); // 45 + 10 + 35
  });

  it("preserves each node's y position", () => {
    const patches = distributeHorizontal([
      n("a", 0, 1, 10, 10),
      n("b", 30, 2, 10, 10),
      n("c", 90, 3, 10, 10),
    ]);
    const ps = posOf(patches);
    expect(ps.a.y).toBe(1);
    expect(ps.b.y).toBe(2);
    expect(ps.c.y).toBe(3);
  });
});

describe("distributeVertical", () => {
  it("returns [] for fewer than 3 nodes", () => {
    expect(distributeVertical([n("a", 0, 0, 10, 10)])).toEqual([]);
  });

  it("keeps outermost edges fixed and equalizes gaps", () => {
    const patches = distributeVertical([
      n("a", 0, 0, 10, 10),
      n("b", 0, 30, 10, 10),
      n("c", 0, 90, 10, 10),
    ]);
    const ps = posOf(patches);
    expect(ps.a).toEqual({ x: 0, y: 0 });
    expect(ps.b).toEqual({ x: 0, y: 45 });
    expect(ps.c).toEqual({ x: 0, y: 90 });
  });
});
