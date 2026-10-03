import { beforeEach, describe, expect, it } from "vitest";
import {
  migrateBotTabType,
  removeTerminalWorkspaceIdentity,
  useTabStore,
} from "./tabStore";

describe("openTab", () => {
  const chatData = {
    providerId: "opencode",
    sessionId: "session-1",
    workspaceId: null,
    directory: "/work/cloudy",
    sessionName: "My Chat",
  };
  const botChatData = {
    sessionId: "session-1",
    workspaceId: "workspace-1",
    directory: "/work/bot",
    sessionName: "Bot Chat",
  };

  beforeEach(() => {
    useTabStore.setState({ tabs: [], activeTabId: "home" });
  });

  it("creates a new tab when no tab for the session is open", () => {
    const id = useTabStore.getState().openTab("chat", chatData);
    const state = useTabStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0]?.id).toBe(id);
    expect(state.activeTabId).toBe(id);
  });

  it("focuses the existing tab for the same session instead of duplicating", () => {
    const first = useTabStore.getState().openTab("chat", chatData);
    useTabStore.setState((state) => ({
      activeTabId: "home",
      tabs: state.tabs.map((tab) => ({ ...tab, updatedAt: 0 })),
    }));

    const second = useTabStore.getState().openTab("chat", {
      ...chatData,
      sessionName: "Renamed",
    });

    const state = useTabStore.getState();
    expect(second).toBe(first);
    expect(state.tabs).toHaveLength(1);
    expect(state.activeTabId).toBe(first);
    expect(state.tabs[0]?.updatedAt).toBeGreaterThan(0);
    expect(state.tabs[0]?.data.sessionName).toBe("My Chat");
  });

  it("does not reuse a tab of a different type for the same session id", () => {
    useTabStore.getState().openTab("chat", chatData);
    useTabStore.getState().openTab("bot-chat", botChatData);
    expect(useTabStore.getState().tabs).toHaveLength(2);
  });

  it("always creates a new tab when sessionId is null", () => {
    useTabStore.getState().openTab("chat", { ...chatData, sessionId: null });
    useTabStore.getState().openTab("chat", { ...chatData, sessionId: null });
    expect(useTabStore.getState().tabs).toHaveLength(2);
  });
});

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
