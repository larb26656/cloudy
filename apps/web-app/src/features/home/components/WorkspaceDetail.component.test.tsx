import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceDetail } from "./WorkspaceDetail";
import { useTabStore } from "@/stores/tabStore";

vi.mock("@/hooks/queries", () => ({
  useDeleteWorkspace: () => ({ mutate: vi.fn() }),
  useMarkWorkspaceActive: () => ({ mutate: vi.fn() }),
  useSessions: () => ({ data: [], isLoading: false, error: null }),
  useCreateSession: () => ({ isPending: false }),
}));

vi.mock("@/hooks/queries/useWorkspaces", () => ({
  useCreateTempWorkspace: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/features/workspace/WorkspaceDialog", () => ({
  WorkspaceDialog: () => null,
}));

vi.mock("@/components/chat/ProviderSelector", () => ({
  ProviderSelector: () => <div>Provider selector</div>,
}));

describe("WorkspaceDetail", () => {
  beforeEach(() => {
    useTabStore.setState({ tabs: [], activeTabId: "home" });
  });

  it("shows a provider selector and creates a chat for the workspace", () => {
    render(
      <WorkspaceDetail
        workspace={{
          id: "workspace-1",
          name: "Cloudy",
          color: "#3B82F6",
          type: "agent",
          directory: "/work/cloudy",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastActiveAt: null,
        }}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText("Provider selector")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "New chat" }));

    expect(useTabStore.getState().tabs).toContainEqual(
      expect.objectContaining({
        type: "chat",
        data: expect.objectContaining({ providerId: "opencode" }),
      }),
    );
  });
});
