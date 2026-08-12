import { describe, expect, it } from "vitest";
import { removeTerminalWorkspaceIdentity } from "./tabStore";

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
});
