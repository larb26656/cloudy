import { describe, expect, it } from "vitest";
import { migrateBotTabType, removeTerminalWorkspaceIdentity } from "./tabStore";

describe("tabStore migration", () => {
  it("removes workspace identity from v6 terminal tabs", async () => {
    const migrated = removeTerminalWorkspaceIdentity([
      {
        id: "terminal-1",
        type: "terminal",
        data: {
          workspaceId: "workspace-1",
          directory: "/work/cloudy",
          ptyId: "pty-1",
        },
        updatedAt: 0,
      },
    ]);

    expect(migrated).toEqual([
      {
        id: "terminal-1",
        type: "terminal",
        data: { directory: "/work/cloudy", ptyId: "pty-1" },
        updatedAt: 0,
      },
    ]);
  });

  it("renames persisted bot tabs to bot-chat", () => {
    expect(
      migrateBotTabType([
        {
          id: "bot-1",
          type: "bot",
          data: {
            workspaceId: "workspace-1",
            directory: "/work/bot",
          },
          updatedAt: 0,
        },
      ]),
    ).toEqual([
      {
        id: "bot-1",
        type: "bot-chat",
        data: {
          workspaceId: "workspace-1",
          directory: "/work/bot",
        },
        updatedAt: 0,
      },
    ]);
  });
});
