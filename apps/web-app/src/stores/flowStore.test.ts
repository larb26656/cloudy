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
              data: { workspaceId: "workspace-1", model: null },
            },
            {
              ...state.flows["desk-1"]!.nodes[1],
              data: { model: null },
            },
          ],
        },
      },
    });
  });

  it("does not migrate current flow data", () => {
    const state = { flows: {} };

    expect(migrateBotNodeType(state, 3)).toBe(state);
  });

  it("normalizes legacy chat-node model selections to ModelInfo", () => {
    const state = {
      flows: {
        "desk-1": {
          nodes: [
            {
              id: "chat-1",
              type: "chat",
              position: { x: 0, y: 0 },
              data: {
                model: {
                  providerID: "openai",
                  modelID: "gpt-5",
                  name: "GPT-5",
                  supportsStreaming: true,
                  supportsTools: true,
                },
              },
            },
            {
              id: "bot-1",
              type: "bot-chat",
              position: { x: 100, y: 100 },
              data: {
                model: { providerID: "anthropic", modelID: "" },
              },
            },
          ],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        },
      },
    };

    expect(migrateBotNodeType(state, 2)).toEqual({
      flows: {
        "desk-1": {
          nodes: [
            {
              id: "chat-1",
              type: "chat",
              position: { x: 0, y: 0 },
              data: {
                model: {
                  providerId: "openai",
                  modelId: "gpt-5",
                  name: "GPT-5",
                  capabilities: { streaming: true, tools: true },
                },
              },
            },
            {
              id: "bot-1",
              type: "bot-chat",
              position: { x: 100, y: 100 },
              data: { model: null },
            },
          ],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        },
      },
    });
  });
});
