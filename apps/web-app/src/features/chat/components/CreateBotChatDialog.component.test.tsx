import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CreateBotChatDialog } from "./CreateBotChatDialog";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/hooks/queries", () => ({
  useSessions: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock("@/features/workspace/WorkspaceSelectStep", () => ({
  WorkspaceSelectStep: ({
    onSelect,
    workspaceType,
  }: {
    onSelect: (workspace: object) => void;
    workspaceType: string;
  }) => (
    <>
      <span>{workspaceType}</span>
      <button
        type="button"
        onClick={() =>
          onSelect({
            id: "bot-workspace-1",
            name: "Support Bot",
            directory: "/work/support",
            type: "bot",
          })
        }
      >
        Support bot workspace
      </button>
    </>
  ),
}));

describe("CreateBotChatDialog", () => {
  it("only starts from a bot workspace", () => {
    const onSubmit = vi.fn();
    render(
      <CreateBotChatDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} />,
    );

    expect(screen.getByText("bot")).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Chat directory" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Support bot workspace" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "+New Bot Chat" }));

    expect(onSubmit).toHaveBeenCalledWith({
      workspaceId: "bot-workspace-1",
      directory: "/work/support",
      sessionId: null,
      sessionName: "New Bot Chat",
    });
  });
});
