import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateChatDialog } from "./CreateChatDialog";
import { useRecentDirectoryStore } from "@/stores/recentDirectoryStore";
import { useDefaultProviderStore } from "@/stores/defaultProviderStore";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  providers: [
    {
      id: "opencode",
      name: "OpenCode",
      capabilities: { requiresDirectory: true },
    },
  ],
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("@/hooks/queries", () => ({
  useSessions: () => ({
    data: [],
    isLoading: false,
  }),
  useCreateTempWorkspace: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/queries/useWorkspaces", () => ({
  useCreateTempWorkspace: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/queries/useModels", () => ({
  useModels: () => ({ data: mocks.providers }),
  useCapacity: (providerId: string) => ({
    data: mocks.providers.find((provider) => provider.id === providerId)
      ?.capabilities,
  }),
}));

vi.mock("@/features/workspace/WorkspaceSelectStep", () => ({
  WorkspaceSelectStep: ({
    onSelect,
  }: {
    onSelect: (workspace: object) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onSelect({
          id: "workspace-1",
          name: "Cloudy",
          directory: "/work/cloudy",
        })
      }
    >
      Cloudy workspace
    </button>
  ),
}));

describe("CreateChatDialog", () => {
  beforeEach(() => {
    useRecentDirectoryStore.setState({ paths: [] });
    useDefaultProviderStore.setState({ defaultProviderId: "opencode" });
    mocks.navigate.mockReset();
    mocks.providers = [
      {
        id: "opencode",
        name: "OpenCode",
        capabilities: { requiresDirectory: true },
      },
    ];
  });

  const renderDialog = (onSubmit = vi.fn()) => {
    render(
      <CreateChatDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} />,
    );
    return onSubmit;
  };

  it("submits a quick-path chat with null workspaceId", () => {
    const onSubmit = renderDialog();

    fireEvent.change(screen.getByRole("textbox", { name: "Chat directory" }), {
      target: { value: "/work/my-app" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Sessions in my-app")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "New Chat" }));

    expect(onSubmit).toHaveBeenCalledWith({
      agent: null,
      workspaceId: null,
      directory: "/work/my-app",
      sessionId: null,
      sessionName: "New Chat",
      providerId: "opencode",
    });
  });

  it("uses the configured default provider for a new chat", () => {
    useDefaultProviderStore.setState({ defaultProviderId: "codex" });
    const onSubmit = renderDialog();

    fireEvent.change(screen.getByRole("textbox", { name: "Chat directory" }), {
      target: { value: "/work/my-app" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "New Chat" }));

    expect(onSubmit).toHaveBeenCalledWith({
      agent: null,
      workspaceId: null,
      directory: "/work/my-app",
      sessionId: null,
      sessionName: "New Chat",
      providerId: "codex",
    });
  });

  it("rejects a relative path and stays on step 1", () => {
    const onSubmit = renderDialog();

    fireEvent.change(screen.getByRole("textbox", { name: "Chat directory" }), {
      target: { value: "relative/path" },
    });
    fireEvent.submit(screen.getByRole("textbox", { name: "Chat directory" }));

    expect(
      screen.getByText("Enter an absolute directory path"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("records the quick path in the recent list", () => {
    renderDialog();

    fireEvent.change(screen.getByRole("textbox", { name: "Chat directory" }), {
      target: { value: "/work/my-app" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(useRecentDirectoryStore.getState().paths).toEqual(["/work/my-app"]);
  });

  it("opens step 2 from a recent path click", () => {
    useRecentDirectoryStore.setState({ paths: ["/tmp/scratch"] });
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "/tmp/scratch" }));

    expect(screen.getByText("Sessions in scratch")).toBeInTheDocument();
  });

  it("removes a recent path without opening step 2", () => {
    useRecentDirectoryStore.setState({ paths: ["/tmp/scratch"] });
    renderDialog();

    fireEvent.click(
      screen.getByRole("button", { name: "Remove /tmp/scratch" }),
    );

    expect(useRecentDirectoryStore.getState().paths).toEqual([]);
    expect(screen.getByText("New Chat")).toBeInTheDocument();
  });

  it("still resolves a registered workspace", () => {
    const onSubmit = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Cloudy workspace" }));
    expect(screen.getByText("Sessions in Cloudy")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New Chat" }));
    expect(onSubmit).toHaveBeenCalledWith({
      agent: null,
      workspaceId: "workspace-1",
      directory: "/work/cloudy",
      sessionId: null,
      sessionName: "New Chat",
      providerId: "opencode",
    });
  });

  it("creates a chat immediately when the provider does not require a directory", () => {
    mocks.providers = [
      {
        id: "opencode",
        name: "OpenCode",
        capabilities: { requiresDirectory: false },
      },
    ];
    const onSubmit = renderDialog();

    expect(
      screen.queryByRole("textbox", { name: "Chat directory" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cloudy workspace" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Temp chat" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "New Chat" }));

    expect(onSubmit).toHaveBeenCalledWith({
      agent: null,
      workspaceId: null,
      directory: "",
      sessionId: null,
      sessionName: "New Chat",
      providerId: "opencode",
    });
  });
});
