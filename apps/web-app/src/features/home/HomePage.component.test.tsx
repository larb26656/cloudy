import { beforeEach, describe, expect, test, vi } from "vitest";
import { useState } from "react";
import { act, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import HomePage from "./HomePage";
import { useTabStore } from "@/stores/tabStore";
import { renderWithProviders } from "@/test/utils";
import type { ChatSession, RecentChatSession } from "@/types";

const workspaces = [
  {
    id: "ws_1",
    name: "Cloudy",
    color: "#3B82F6",
    type: "agent",
    directory: "/project",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastActiveAt: null,
  },
];

const sessions: ChatSession[] = [
  {
    id: "ses_1",
    providerId: "opencode",
    title: "Session One",
    parentID: null,
    directory: "/project",
    status: "idle",
    runStatus: "completed",
    updatedAt: Date.now(),
    cost: 0,
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
  },
];

vi.mock("@/hooks/queries/useSessions", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useMarkWorkspaceActive: () => ({ mutate: vi.fn() }),
    useSessions: () => ({ data: sessions, isLoading: false }),
    useRecentSessions: () => ({
      data: [] as RecentChatSession[],
      isLoading: false,
    }),
  };
});

vi.mock("@/hooks/queries", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useWorkspaces: () => ({ data: workspaces, isLoading: false }),
    useWorkspace: () => ({ data: workspaces[0] }),
    useCreateTempWorkspace: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

vi.mock("@/hooks/useNotificationsStream", () => ({
  useNotificationsStream: () => ({}),
}));

vi.mock("./tabs/implementations/chat/ChatContent", () => ({
  ChatContent: () => {
    const [draft, setDraft] = useState("");
    return (
      <textarea
        aria-label="chat draft"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
    );
  },
}));

vi.mock("@/providers", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useGlobalEvent: () => ({ status: "CONNETED", reconnect: vi.fn() }),
  };
});

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({
      children,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a {...props}>{children}</a>
    ),
  };
});

beforeEach(() => {
  useTabStore.setState({ tabs: [], activeTabId: "home" });
  Element.prototype.scrollTo = () => {};
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

describe("HomePage work-on-a-project flow", () => {
  test("shows the content for each home menu section", async () => {
    renderWithProviders(<HomePage />);
    const user = userEvent.setup();
    const navigation = within(screen.getByRole("navigation", { name: "Main" }));

    await user.click(navigation.getByRole("button", { name: "Workspaces" }));
    expect(
      screen.getByRole("heading", { name: "Workspaces", level: 1 }),
    ).toBeInTheDocument();

    await user.click(navigation.getByRole("button", { name: "Home" }));
    expect(screen.getByRole("button", { name: /ask anything/i })).toBeVisible();
  });

  test("Ask anything opens a chat with the Cloudy provider", async () => {
    renderWithProviders(<HomePage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /ask anything/i }));

    const activeTab = useTabStore
      .getState()
      .tabs.find((tab) => tab.id === useTabStore.getState().activeTabId);
    expect(activeTab).toMatchObject({
      type: "chat",
      data: {
        providerId: "cloudy",
        sessionId: null,
        directory: "",
        sessionName: "Cloudy Chat",
      },
    });
  });

  test("keeps a chat draft when switching away from and back to its tab", async () => {
    const chatTabId = useTabStore.getState().addTab("chat", {
      providerId: "opencode",
      sessionId: null,
      workspaceId: null,
      directory: "/project",
      sessionName: "New Chat",
    });

    renderWithProviders(<HomePage />);
    const user = userEvent.setup();
    const draftInput = screen.getByRole("textbox", { name: "chat draft" });

    await user.type(draftInput, "unsent draft");
    act(() => useTabStore.getState().setActiveTab("home"));
    act(() => useTabStore.getState().setActiveTab(chatTabId));

    expect(screen.getByRole("textbox", { name: "chat draft" })).toHaveValue(
      "unsent draft",
    );
  });

  test("selecting a session opens a tab and the dialog unmounts", async () => {
    renderWithProviders(<HomePage />);
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: /work on a project/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /use existing workspace/i }),
    );
    await user.click(await screen.findByRole("button", { name: "Cloudy" }));
    await user.click(
      await screen.findByRole("button", { name: "Session One" }),
    );

    const activeTabId = useTabStore.getState().activeTabId;
    expect(activeTabId).not.toBe("home");
    expect(
      useTabStore.getState().tabs.find((t) => t.id === activeTabId)?.data
        .sessionId,
    ).toBe("ses_1");

    await waitFor(
      () => {
        const popup = document.querySelector('[data-slot="dialog-content"]');
        const overlay = document.querySelector('[data-slot="dialog-overlay"]');
        expect(popup).toBeNull();
        expect(overlay).toBeNull();
      },
      { timeout: 1500 },
    );
  });
});
