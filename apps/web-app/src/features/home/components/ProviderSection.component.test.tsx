import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useTabStore } from "@/stores/tabStore";
import { useRecentDirectoryStore } from "@/stores/recentDirectoryStore";
import { ProviderSection } from "./ProviderSection";

const mocks = vi.hoisted(() => ({
  providers: [] as {
    id: string;
    name: string;
    capabilities: { requiresDirectory: boolean };
  }[],
  mutate: vi.fn(),
}));

vi.mock("@/hooks/queries", () => ({
  useModels: () => ({ data: mocks.providers, isLoading: false }),
  useCreateTempWorkspace: () => ({ mutate: mocks.mutate, isPending: false }),
}));

vi.mock("@/components/provider/ProviderIcon", () => ({
  ProviderIcon: () => null,
}));

beforeEach(() => {
  mocks.providers = [];
  mocks.mutate.mockReset();
  useTabStore.setState({ tabs: [], activeTabId: "home" });
  useRecentDirectoryStore.setState({ paths: [] });
});

describe("ProviderSection", () => {
  it("opens a directoryless chat without creating a temp workspace", () => {
    mocks.providers = [
      {
        id: "directoryless",
        name: "Directoryless Agent",
        capabilities: { requiresDirectory: false },
      },
    ];
    render(<ProviderSection />);

    fireEvent.click(
      screen.getByRole("button", { name: "Directoryless Agent" }),
    );

    expect(mocks.mutate).not.toHaveBeenCalled();
    const tab = useTabStore.getState().tabs[0];
    expect(tab?.type).toBe("chat");
    expect(tab?.data).toMatchObject({
      providerId: "directoryless",
      sessionId: null,
      workspaceId: null,
      directory: "",
      sessionName: "New Chat",
    });
    expect(useRecentDirectoryStore.getState().paths).toEqual([]);
  });

  it("creates a temp workspace when the provider requires a directory", () => {
    mocks.providers = [
      {
        id: "directory-required",
        name: "Directory Agent",
        capabilities: { requiresDirectory: true },
      },
    ];
    render(<ProviderSection />);

    fireEvent.click(screen.getByRole("button", { name: "Directory Agent" }));

    expect(mocks.mutate).toHaveBeenCalledOnce();
  });
});
