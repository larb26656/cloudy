import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationBell } from "./NotificationBell";
import { useTabStore } from "@/stores/tabStore";
import type { RecentChatSession } from "@/types";

const mocks = vi.hoisted(() => ({
  useAgentActivity: vi.fn(),
  useNotifications: vi.fn(),
  useClearNotifications: vi.fn(),
  useDeleteNotification: vi.fn(),
}));

vi.mock("@/hooks/useAgentActivity", () => ({
  useAgentActivity: mocks.useAgentActivity,
}));

vi.mock("@/hooks/queries", () => ({
  useNotifications: mocks.useNotifications,
  useClearNotifications: mocks.useClearNotifications,
  useDeleteNotification: mocks.useDeleteNotification,
}));

function renderBell() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <NotificationBell />
    </QueryClientProvider>,
  );
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

describe("NotificationBell", () => {
  beforeEach(() => {
    mocks.useAgentActivity.mockReturnValue({
      records: [],
      activityState: "idle",
      waitingCount: 0,
      workingCount: 0,
      isLoading: false,
      error: null,
      workspaces: [],
    });
    mocks.useNotifications.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    mocks.useClearNotifications.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mocks.useDeleteNotification.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    useTabStore.setState({ tabs: [], activeTabId: "home" });
  });

  it("shows the idle Cloudy sprite and both sections in one popover", () => {
    renderBell();

    const trigger = screen.getByRole("button", {
      name: "Cloudy: No active sessions",
    });
    expect(trigger.querySelector("[data-pet-sprite]")).toHaveAttribute(
      "data-pet-row",
      "0",
    );

    fireEvent.click(trigger);

    expect(screen.getByText("Agent activity")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("No session needs attention")).toBeInTheDocument();
    expect(screen.getByText("No notifications")).toBeInTheDocument();
  });

  it("maps waiting activity to the sprite and retains the unread dot", () => {
    mocks.useAgentActivity.mockReturnValue({
      records: [],
      activityState: "wait-for-human",
      waitingCount: 1,
      workingCount: 2,
      isLoading: false,
      error: null,
      workspaces: [],
    });
    mocks.useNotifications.mockReturnValue({
      data: [{ id: "notification-1" }],
      isLoading: false,
      isError: false,
    });

    renderBell();

    const trigger = screen.getByRole("button", {
      name: "Cloudy: 1 session waiting for you, 1 unread notifications",
    });
    expect(trigger.querySelector("[data-pet-sprite]")).toHaveAttribute(
      "data-pet-row",
      "2",
    );
    expect(
      trigger.querySelector('[data-slot="notification-dot"]'),
    ).toBeTruthy();
  });

  it("uses the working sprite state and announces the working count", () => {
    mocks.useAgentActivity.mockReturnValue({
      records: [],
      activityState: "working",
      waitingCount: 0,
      workingCount: 2,
      isLoading: false,
      error: null,
      workspaces: [],
    });

    renderBell();

    const trigger = screen.getByRole("button", {
      name: "Cloudy: 2 sessions working",
    });
    expect(trigger.querySelector("[data-pet-sprite]")).toHaveAttribute(
      "data-pet-row",
      "1",
    );
  });

  it("clears notifications and opens a selected activity session in a chat tab", () => {
    const clear = vi.fn();
    mocks.useClearNotifications.mockReturnValue({
      mutate: clear,
      isPending: false,
    });
    const activeSession = session({ id: "session-1" });
    mocks.useAgentActivity.mockReturnValue({
      records: [{ session: activeSession, state: "working" }],
      activityState: "working",
      waitingCount: 0,
      workingCount: 1,
      isLoading: false,
      error: null,
      workspaces: [],
    });
    mocks.useNotifications.mockReturnValue({
      data: [
        {
          id: "notification-1",
          type: "info",
          title: "Build complete",
          message: "Ready",
          createdAt: new Date("2026-10-31T10:00:00Z"),
        },
      ],
      isLoading: false,
      isError: false,
    });

    renderBell();
    fireEvent.click(screen.getByRole("button", { name: /Cloudy:/ }));

    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(clear).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: /Session session-1/ }));
    const { tabs, activeTabId } = useTabStore.getState();
    const opened = tabs.find((tab) => tab.id === activeTabId);
    expect(opened?.type).toBe("chat");
    expect((opened?.data as { sessionId?: string }).sessionId).toBe(
      "session-1",
    );
    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
  });
});
