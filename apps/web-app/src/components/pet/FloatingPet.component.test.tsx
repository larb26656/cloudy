import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FloatingPet } from "./FloatingPet";
import { useTabStore } from "@/stores/tabStore";
import type { RecentChatSession } from "@/types";

const mocks = vi.hoisted(() => ({
  useRecentSessions: vi.fn(),
  useWorkspaces: vi.fn(),
  sessionQuestions: vi.fn(),
  sessionPermissions: vi.fn(),
}));

vi.mock("@/hooks/queries/useSessions", () => ({
  useRecentSessions: mocks.useRecentSessions,
}));

vi.mock("@/hooks/queries", () => ({
  useWorkspaces: mocks.useWorkspaces,
}));

vi.mock("@/lib/cloudy/provider", () => ({
  sessionApi: {
    questions: mocks.sessionQuestions,
    permissions: mocks.sessionPermissions,
  },
  providerApi: {},
}));

function jsonResponse(data: unknown): Response {
  return {
    ok: true,
    json: () => Promise.resolve(data),
  } as unknown as Response;
}

function session(
  overrides: Partial<RecentChatSession> & { id: string },
): RecentChatSession {
  return {
    providerId: "opencode",
    title: `Session ${overrides.id}`,
    directory: "/work/cloudy",
    status: "active",
    runStatus: "running",
    updatedAt: 1_000,
    ...overrides,
  };
}

function pendingQuestion(sessionId: string) {
  return {
    id: `question_${sessionId}`,
    sessionId,
    questions: [{ header: "Next step", question: "Continue?", options: [] }],
  };
}

function pendingPermission(sessionId: string) {
  return {
    id: `permission_${sessionId}`,
    sessionId,
    permission: "bash",
    patterns: ["rm -rf *"],
  };
}

function renderPet() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <FloatingPet />
    </QueryClientProvider>,
  );
}

async function openSummary() {
  fireEvent.click(screen.getByRole("button", { name: /^Agent activity/ }));
}

describe("FloatingPet", () => {
  beforeEach(() => {
    mocks.useRecentSessions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    mocks.useWorkspaces.mockReturnValue({ data: [] });
    mocks.sessionQuestions.mockImplementation(async () => jsonResponse([]));
    mocks.sessionPermissions.mockImplementation(async () => jsonResponse([]));
    useTabStore.setState({ tabs: [], activeTabId: "home" });
  });

  it("prioritizes a pending question over running state and lists only active sessions", async () => {
    mocks.useRecentSessions.mockReturnValue({
      data: [
        session({ id: "session_1" }),
        session({ id: "session_2", updatedAt: 2_000 }),
        session({
          id: "session_3",
          status: "idle",
          runStatus: "completed",
        }),
        session({
          id: "session_4",
          status: "active",
          runStatus: "completed",
        }),
      ],
      isLoading: false,
      error: null,
    });
    mocks.sessionQuestions.mockImplementation(async (id: string) =>
      jsonResponse(id === "session_2" ? [pendingQuestion("session_2")] : []),
    );

    renderPet();

    const trigger = await screen.findByRole("button", {
      name: "Agent activity: 1 session waiting for you",
    });
    expect(trigger).toHaveAttribute("data-pet-state", "wait-for-human");
    expect(trigger.querySelector("[data-pet-sprite]")).toHaveAttribute(
      "data-pet-row",
      "2",
    );

    await openSummary();

    expect(await screen.findByText("Session session_2")).toBeInTheDocument();
    expect(screen.getByText("Session session_1")).toBeInTheDocument();
    expect(screen.queryByText("Session session_3")).not.toBeInTheDocument();
    expect(screen.queryByText("Session session_4")).not.toBeInTheDocument();

    const rows = screen.getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("Session session_2");
    expect(rows[0]).toHaveTextContent("Waiting for you");
    expect(rows[1]).toHaveTextContent("Session session_1");
    expect(rows[1]).toHaveTextContent("Working");
  });

  it("marks a session waiting on a permission", async () => {
    mocks.useRecentSessions.mockReturnValue({
      data: [session({ id: "session_1", directory: "/work/bot" })],
      isLoading: false,
      error: null,
    });
    mocks.sessionPermissions.mockImplementation(async (id: string) =>
      jsonResponse(id === "session_1" ? [pendingPermission("session_1")] : []),
    );

    renderPet();
    await openSummary();

    expect(await screen.findByText("Session session_1")).toBeInTheDocument();
    expect(await screen.findByText("Waiting for you")).toBeInTheDocument();
  });

  it("uses the working sprite row while an agent is running", async () => {
    mocks.useRecentSessions.mockReturnValue({
      data: [session({ id: "session_1" })],
      isLoading: false,
      error: null,
    });

    renderPet();

    const trigger = await screen.findByRole("button", {
      name: "Agent activity: 1 session working",
    });
    expect(trigger).toHaveAttribute("data-pet-state", "working");
    expect(trigger.querySelector("[data-pet-sprite]")).toHaveAttribute(
      "data-pet-row",
      "1",
    );
    expect(trigger.querySelector("[data-pet-sprite]")).toHaveStyle({
      backgroundImage: "url(/sprite/cloudy-pet/sprite-sheet-8bit.png)",
      backgroundSize: "900% 300%",
      imageRendering: "pixelated",
    });
  });

  it("moves the pet when it is dragged", () => {
    renderPet();

    const trigger = screen.getByRole("button", { name: "Agent activity" });
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
      left: 900,
      top: 650,
      width: 80,
      height: 80,
      right: 980,
      bottom: 730,
      x: 900,
      y: 650,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(trigger, {
      pointerId: 1,
      clientX: 920,
      clientY: 670,
    });
    fireEvent.pointerMove(trigger, {
      pointerId: 1,
      clientX: 320,
      clientY: 240,
    });
    fireEvent.pointerUp(trigger, { pointerId: 1, clientX: 320, clientY: 240 });

    expect(trigger).toHaveStyle({ left: "300px", top: "220px" });
  });

  it("states that no session needs attention when everything is idle", async () => {
    mocks.useRecentSessions.mockReturnValue({
      data: [
        session({ id: "session_1", status: "idle", runStatus: "completed" }),
      ],
      isLoading: false,
      error: null,
    });

    renderPet();
    await openSummary();

    expect(
      screen.getByRole("button", { name: "Agent activity" }),
    ).toHaveAttribute("data-pet-state", "idle");

    expect(
      await screen.findByText("No session needs attention"),
    ).toBeInTheDocument();
  });

  it("opens a chat tab for the selected session and focuses an existing tab", async () => {
    mocks.useRecentSessions.mockReturnValue({
      data: [
        session({ id: "session_1", directory: "/work/cloudy" }),
        session({ id: "session_2", directory: "/work/cloudy" }),
      ],
      isLoading: false,
      error: null,
    });
    mocks.useWorkspaces.mockReturnValue({
      data: [
        {
          id: "ws_1",
          name: "Cloudy",
          color: "oklch(0.623 0.214 259.815)",
          type: "agent",
          directory: "/work/cloudy",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
    useTabStore.setState({
      tabs: [
        {
          id: "tab-existing",
          type: "chat",
          data: {
            providerId: "opencode",
            sessionId: "session_2",
            workspaceId: null,
            directory: "/work/cloudy",
            sessionName: "Existing",
          },
          updatedAt: 0,
        },
      ],
      activeTabId: "home",
    });

    renderPet();
    await openSummary();

    fireEvent.click(await screen.findByText("Session session_1"));
    const { tabs, activeTabId } = useTabStore.getState();
    expect(tabs).toHaveLength(2);
    expect(activeTabId).not.toBe("home");
    const opened = tabs.find((tab) => tab.id === activeTabId);
    expect(opened?.type).toBe("chat");
    expect((opened?.data as { sessionId?: string }).sessionId).toBe(
      "session_1",
    );
    expect((opened?.data as { workspaceId?: string | null }).workspaceId).toBe(
      "ws_1",
    );

    await openSummary();
    fireEvent.click(screen.getByText("Session session_2"));
    expect(useTabStore.getState().activeTabId).toBe("tab-existing");
    expect(useTabStore.getState().tabs).toHaveLength(2);
  });

  it("opens a bot-chat tab for sessions in bot workspaces", async () => {
    mocks.useRecentSessions.mockReturnValue({
      data: [session({ id: "session_bot", directory: "/work/bot" })],
      isLoading: false,
      error: null,
    });
    mocks.useWorkspaces.mockReturnValue({
      data: [
        {
          id: "ws_bot",
          name: "Bot",
          color: "oklch(0.58 0.22 27)",
          type: "bot",
          directory: "/work/bot",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    renderPet();
    await openSummary();

    fireEvent.click(await screen.findByText("Session session_bot"));
    const { tabs, activeTabId } = useTabStore.getState();
    const opened = tabs.find((tab) => tab.id === activeTabId);
    expect(opened?.type).toBe("bot-chat");
    expect((opened?.data as { workspaceId?: string }).workspaceId).toBe(
      "ws_bot",
    );
  });

  it("closes the summary without dismissing the widget", async () => {
    renderPet();
    await openSummary();

    expect(await screen.findByText("Agent activity")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Close agent activity" }),
    );

    expect(screen.queryByText("Agent activity")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Agent activity/ }),
    ).toBeInTheDocument();
  });

  it("hides the widget on dismiss and brings it back via the restore control", async () => {
    renderPet();
    await openSummary();

    fireEvent.click(await screen.findByRole("button", { name: "Hide pet" }));

    expect(
      screen.queryByRole("button", { name: /^Agent activity/ }),
    ).not.toBeInTheDocument();
    const restore = screen.getByRole("button", { name: "Show pet" });
    expect(restore).toBeInTheDocument();

    fireEvent.click(restore);

    expect(
      screen.getByRole("button", { name: "Agent activity" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show pet" }),
    ).not.toBeInTheDocument();
  });
});
