import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TerminalWorkspaceDialog } from "./TerminalWorkspaceDialog";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  sessions: [] as Array<Record<string, unknown>>,
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("@/hooks/queries", () => ({
  usePtySessions: () => ({
    data: mocks.sessions,
    isLoading: false,
    error: null,
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

describe("TerminalWorkspaceDialog", () => {
  beforeEach(() => {
    mocks.sessions = [];
    mocks.navigate.mockReset();
  });

  it("resolves a workspace to directory-only terminal data", () => {
    const onSubmit = vi.fn();
    render(
      <TerminalWorkspaceDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cloudy workspace" }));

    expect(onSubmit).toHaveBeenCalledWith({
      directory: "/work/cloudy",
      ptyId: null,
    });
  });

  it("rejects a relative directory and accepts an absolute path", () => {
    const onSubmit = vi.fn();
    render(
      <TerminalWorkspaceDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    const input = screen.getByRole("textbox", { name: "Terminal directory" });

    fireEvent.change(input, { target: { value: "relative/path" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(
      screen.getByText("Enter an absolute directory path"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "/work/cloudy" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(onSubmit).toHaveBeenCalledWith({
      directory: "/work/cloudy",
      ptyId: null,
    });
  });

  it("lists running sessions and confirms before attaching", () => {
    mocks.sessions = [
      {
        id: "pty-running",
        name: "Quiet Harbor",
        directory: "/work/cloudy",
        command: "/bin/zsh",
        alive: true,
        exitCode: null,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
      },
      {
        id: "pty-exited",
        name: "Amber Comet",
        directory: "/tmp",
        command: "/bin/zsh",
        alive: false,
        exitCode: 0,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
      },
    ];
    const onSubmit = vi.fn();
    render(
      <TerminalWorkspaceDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Existing session" }));
    expect(screen.getByText("Quiet Harbor")).toBeInTheDocument();
    expect(screen.queryByText("Amber Comet")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Quiet Harbor/ }));
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Attach session" }));

    expect(onSubmit).toHaveBeenCalledWith({
      directory: "/work/cloudy",
      ptyId: "pty-running",
    });
  });
});
