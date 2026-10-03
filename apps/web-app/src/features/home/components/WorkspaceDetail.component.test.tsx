import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceDetail } from "./WorkspaceDetail";
import { useDefaultProviderStore } from "@/stores/defaultProviderStore";
import { useTabStore } from "@/stores/tabStore";

vi.mock("@/hooks/queries", () => ({
  useDeleteWorkspace: () => ({ mutate: vi.fn() }),
  useSessions: () => ({ data: [], isLoading: false, error: null }),
  useCreateSession: () => ({ isPending: false }),
}));

vi.mock("@/features/workspace/WorkspaceDialog", () => ({
  WorkspaceDialog: () => null,
}));

describe("WorkspaceDetail", () => {
  beforeEach(() => {
    useDefaultProviderStore.setState({ defaultProviderId: "opencode" });
    useTabStore.setState({ tabs: [], activeTabId: "home" });
  });

  it("uses the configured provider for a new agent chat", () => {
    useDefaultProviderStore.setState({ defaultProviderId: "codex" });

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
        }}
        onBack={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "New chat" }));

    expect(useTabStore.getState().tabs).toContainEqual(
      expect.objectContaining({
        type: "chat",
        data: expect.objectContaining({ providerId: "codex" }),
      }),
    );
  });
});
