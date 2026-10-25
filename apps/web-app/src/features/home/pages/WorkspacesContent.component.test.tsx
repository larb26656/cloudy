import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspacesContent } from "./WorkspacesContent";
import { WORKSPACE_COLORS, type Workspace } from "@/lib/cloudy/workspaces";

const workspaces: Workspace[] = Array.from({ length: 8 }, (_, index) => ({
  id: `workspace-${index + 1}`,
  name: `Workspace ${index + 1}`,
  color: WORKSPACE_COLORS[0],
  type: "agent",
  directory: `/projects/${index + 1}`,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  lastActiveAt: null,
}));

vi.mock("@/hooks/queries", () => ({
  useWorkspaces: () => ({ data: workspaces, isLoading: false, error: null }),
}));

vi.mock("@/features/workspace/WorkspaceDialog", () => ({
  WorkspaceDialog: () => null,
}));

vi.mock("../components/WorkspaceDetail", () => ({
  WorkspaceDetail: ({
    workspace,
    onBack,
  }: {
    workspace: Workspace;
    onBack: () => void;
  }) => (
    <div>
      <h1>{workspace.name} details</h1>
      <button type="button" onClick={onBack}>
        Back to Workspaces
      </button>
    </div>
  ),
}));

describe("WorkspacesContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows all workspaces and opens a selected workspace", () => {
    render(<WorkspacesContent />);

    expect(screen.getByText("8 workspaces")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Workspace 8/ }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Workspace 8/ }));
    expect(
      screen.getByRole("heading", { name: "Workspace 8 details" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to Workspaces" }));
    expect(
      screen.getByRole("heading", { name: "Workspaces" }),
    ).toBeInTheDocument();
  });
});
