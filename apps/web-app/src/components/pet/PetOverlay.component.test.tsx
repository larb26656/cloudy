import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PetOverlay } from "./PetOverlay";
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

const bridge = {
  dragStart: vi.fn(),
  dragMove: vi.fn(),
  dragEnd: vi.fn(),
  setSize: vi.fn(),
  focusMain: vi.fn(),
  openSession: vi.fn(),
  onOpenSession: vi.fn(() => () => {}),
  showContextMenu: vi.fn(),
};

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

function workspace(overrides: {
  id: string;
  name: string;
  directory: string;
  type?: "agent" | "bot";
}) {
  return {
    color: "#3B82F6",
    type: "agent" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function renderOverlay() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <PetOverlay />
    </QueryClientProvider>,
  );
}

describe("PetOverlay", () => {
  beforeEach(() => {
    mocks.useRecentSessions.mockReturnValue({
      data: [session({ id: "session_1" })],
      isLoading: false,
      error: null,
    });
    mocks.useWorkspaces.mockReturnValue({ data: [] });
    mocks.sessionQuestions.mockImplementation(async () => jsonResponse([]));
    mocks.sessionPermissions.mockImplementation(async () => jsonResponse([]));
    window.__CLOUDY_DESKTOP__ = {
      apiUrl: "http://localhost:4122",
      isDev: true,
      platform: "darwin",
      windowKind: "pet",
      petBridge: bridge,
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete window.__CLOUDY_DESKTOP__;
  });

  it("renders the sprite bottom-right and sizes the window collapsed on mount", async () => {
    renderOverlay();

    const trigger = await screen.findByRole("button", {
      name: "Agent activity: 1 session working",
    });
    expect(trigger).toHaveAttribute("data-pet-state", "working");
    expect(trigger).toHaveClass("absolute", "bottom-3", "right-3");
    expect(bridge.setSize).toHaveBeenCalledWith(144, 160);
  });

  it("expands the activity panel up-and-left when the sprite is clicked", async () => {
    renderOverlay();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Agent activity: 1 session working",
      }),
    );

    expect(screen.getByText("Agent activity")).toBeInTheDocument();
    expect(screen.getByText("Session session_1")).toBeInTheDocument();
    expect(bridge.setSize).toHaveBeenLastCalledWith(448, 384);
  });

  it("collapses the panel via the close button", async () => {
    renderOverlay();

    const trigger = await screen.findByRole("button", {
      name: "Agent activity: 1 session working",
    });
    fireEvent.click(trigger);
    fireEvent.click(
      screen.getByRole("button", { name: "Close agent activity" }),
    );

    expect(screen.queryByText("Session session_1")).not.toBeInTheDocument();
    expect(bridge.setSize).toHaveBeenLastCalledWith(144, 160);
  });

  it("relays a chat session to the main window and collapses", async () => {
    mocks.useWorkspaces.mockReturnValue({
      data: [
        workspace({ id: "ws_1", name: "Cloudy", directory: "/work/cloudy" }),
      ],
    });

    renderOverlay();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Agent activity: 1 session working",
      }),
    );

    fireEvent.click(await screen.findByText("Session session_1"));

    expect(bridge.openSession).toHaveBeenCalledWith({
      type: "chat",
      data: {
        providerId: "opencode",
        sessionId: "session_1",
        workspaceId: "ws_1",
        directory: "/work/cloudy",
        sessionName: "Session session_1",
      },
    });
    expect(bridge.focusMain).toHaveBeenCalled();
    expect(bridge.setSize).toHaveBeenLastCalledWith(144, 160);
  });

  it("relays a bot-chat session for bot workspaces", async () => {
    mocks.useRecentSessions.mockReturnValue({
      data: [session({ id: "session_bot", directory: "/work/bot" })],
      isLoading: false,
      error: null,
    });
    mocks.useWorkspaces.mockReturnValue({
      data: [
        workspace({
          id: "ws_bot",
          name: "Bot",
          directory: "/work/bot",
          type: "bot",
        }),
      ],
    });

    renderOverlay();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Agent activity: 1 session working",
      }),
    );

    fireEvent.click(await screen.findByText("Session session_bot"));

    expect(bridge.openSession).toHaveBeenCalledWith({
      type: "bot-chat",
      data: {
        sessionId: "session_bot",
        workspaceId: "ws_bot",
        directory: "/work/bot",
        sessionName: "Session session_bot",
      },
    });
  });

  it("moves the window via the bridge while dragging and suppresses the click", () => {
    renderOverlay();

    const trigger = screen.getByRole("button", {
      name: "Agent activity: 1 session working",
    });
    fireEvent.pointerDown(trigger, {
      pointerId: 1,
      screenX: 100,
      screenY: 100,
    });
    fireEvent.pointerMove(trigger, {
      pointerId: 1,
      screenX: 140,
      screenY: 130,
    });
    fireEvent.pointerUp(trigger, {
      pointerId: 1,
      screenX: 140,
      screenY: 130,
    });
    fireEvent.click(trigger);

    expect(bridge.dragStart).toHaveBeenCalledTimes(1);
    expect(bridge.dragMove).toHaveBeenCalledWith(140, 130);
    expect(bridge.dragEnd).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Session session_1")).not.toBeInTheDocument();
  });

  it("opens the native context menu on right-click without starting a drag", () => {
    renderOverlay();

    const trigger = screen.getByRole("button", {
      name: "Agent activity: 1 session working",
    });
    fireEvent.pointerDown(trigger, {
      pointerId: 1,
      button: 2,
      screenX: 100,
      screenY: 100,
    });
    fireEvent.contextMenu(trigger);

    expect(bridge.dragStart).not.toHaveBeenCalled();
    expect(bridge.showContextMenu).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Session session_1")).not.toBeInTheDocument();
  });

  it("renders the empty state when no session needs attention", async () => {
    mocks.useRecentSessions.mockReturnValue({
      data: [
        session({ id: "session_1", status: "idle", runStatus: "completed" }),
      ],
      isLoading: false,
      error: null,
    });

    renderOverlay();
    fireEvent.click(
      await screen.findByRole("button", { name: "Agent activity" }),
    );

    expect(
      await screen.findByText("No session needs attention"),
    ).toBeInTheDocument();
  });

  it("renders without a desktop bridge and no-ops session clicks gracefully", async () => {
    delete window.__CLOUDY_DESKTOP__;

    renderOverlay();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Agent activity: 1 session working",
      }),
    );

    fireEvent.click(await screen.findByText("Session session_1"));

    expect(bridge.openSession).not.toHaveBeenCalled();
    expect(screen.queryByText("Session session_1")).not.toBeInTheDocument();
  });
});
