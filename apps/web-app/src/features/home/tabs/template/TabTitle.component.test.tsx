import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTabWorkspaceId, TabTitle } from "./TabTitle";

const mocks = vi.hoisted(() => ({
  useSession: vi.fn(),
  useWorkspace: vi.fn(),
}));

vi.mock("@/hooks/queries", () => ({
  useWorkspace: mocks.useWorkspace,
}));

vi.mock("@/hooks/queries/useSessions", () => ({
  useSession: mocks.useSession,
}));

describe("TabTitle", () => {
  beforeEach(() => {
    mocks.useSession.mockReturnValue({ data: undefined });
    mocks.useWorkspace.mockReturnValue({ data: undefined });
  });

  it("uses the current chat session title in every tab surface", () => {
    mocks.useSession.mockReturnValue({ data: { title: "Fix tab titles" } });

    const tab = {
      id: "chat-1",
      type: "chat" as const,
      data: {
        sessionId: "session-1",
        sessionName: "New Chat",
        workspaceId: "workspace-1",
        directory: "/work/cloudy",
      },
      updatedAt: 0,
    };

    render(<TabTitle tab={tab} />);

    expect(screen.getByText("Fix tab titles")).toBeInTheDocument();
    expect(mocks.useSession).toHaveBeenCalledWith({
      sessionId: "session-1",
      directory: "/work/cloudy",
    });
    expect(getTabWorkspaceId(tab)).toBe("workspace-1");
  });

  it("renders the shared static titles", () => {
    const { rerender } = render(
      <TabTitle
        tab={{
          id: "desk-1",
          type: "desk",
          data: { name: "Architecture" },
          updatedAt: 0,
        }}
      />,
    );

    expect(screen.getByText("Architecture")).toBeInTheDocument();

    rerender(
      <TabTitle
        tab={{
          id: "webview-1",
          type: "webview",
          data: { url: "https://example.com/path" },
          updatedAt: 0,
        }}
      />,
    );

    expect(screen.getByText("example.com")).toBeInTheDocument();

    rerender(
      <TabTitle
        tab={{
          id: "files-1",
          type: "files",
          data: { workspaceId: "workspace-1", directory: "/work/cloudy" },
          updatedAt: 0,
        }}
      />,
    );

    expect(screen.getByText("Changed Files")).toBeInTheDocument();

    rerender(
      <TabTitle
        tab={{
          id: "terminal-1",
          type: "terminal",
          data: {
            workspaceId: "workspace-1",
            directory: "/work/cloudy",
            ptyId: null,
          },
          updatedAt: 0,
        }}
      />,
    );

    expect(screen.getByText("Terminal")).toBeInTheDocument();
  });
});
