import { describe, expect, it } from "vitest";
import { migrateBotNodeType } from "./flowStore";

describe("flowStore migration", () => {
  it("renames persisted bot nodes to bot-chat", () => {
    const state = {
      flows: {
        "desk-1": {
          nodes: [
            {
              id: "bot-1",
              type: "bot",
              position: { x: 0, y: 0 },
              data: { workspaceId: "workspace-1" },
            },
            {
              id: "chat-1",
              type: "chat",
              position: { x: 100, y: 100 },
              data: {},
            },
          ],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        },
      },
    };

    expect(migrateBotNodeType(state, 1)).toEqual({
      flows: {
        "desk-1": {
          ...state.flows["desk-1"],
          nodes: [
            {
              ...state.flows["desk-1"]!.nodes[0],
              type: "bot-chat",
            },
            state.flows["desk-1"]!.nodes[1],
          ],
        },
      },
    });
  });

  it("does not migrate current flow data", () => {
    const state = { flows: {} };

    expect(migrateBotNodeType(state, 2)).toBe(state);
  });
});
