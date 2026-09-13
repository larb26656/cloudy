import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatSurface } from "./ChatSurface";
import type { ModelConfig } from "@/types";
import type { Workspace } from "@/lib/cloudy/workspaces";

const mockUseWorkspace = vi.fn();
vi.mock("@/hooks/queries", () => ({
  useWorkspace: (id: string | null) => mockUseWorkspace(id),
}));

vi.mock("./ChatContainer", () => ({
  ChatContainer: ({
    agent,
    onAgentChange,
    onModelChange,
  }: {
    agent?: string | null;
    onAgentChange?: (agent: string | null) => void;
    onModelChange?: (model: ModelConfig | null) => void;
  }) => (
    <div data-testid="chat-container">
      <span data-testid="chat-agent">{agent ?? "none"}</span>
      <button
        data-testid="chat-set-agent"
        onClick={() => onAgentChange?.("build")}
      >
        set agent
      </button>
      <button
        data-testid="chat-set-model"
        onClick={() =>
          onModelChange?.({
            providerID: "p1",
            modelID: "m1",
            name: "Test",
            supportsStreaming: true,
            supportsTools: true,
          })
        }
      >
        set model
      </button>
    </div>
  ),
}));

vi.mock("./BotChatContainer", () => ({
  BotChatContainer: ({
    onModelChange,
  }: {
    onModelChange?: (model: ModelConfig | null) => void;
  }) => (
    <div data-testid="bot-chat-container">
      <button
        data-testid="bot-set-model"
        onClick={() =>
          onModelChange?.({
            providerID: "p1",
            modelID: "m1",
            name: "Test",
            supportsStreaming: true,
            supportsTools: true,
          })
        }
      >
        set model
      </button>
    </div>
  ),
}));

const baseWorkspace: Workspace = {
  id: "ws_1",
  name: "Demo",
  color: "#000000",
  type: "agent",
  directory: "/demo",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const botWorkspace: Workspace = { ...baseWorkspace, type: "bot" };

describe("ChatSurface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders ChatContainer when workspace is an agent workspace", () => {
    mockUseWorkspace.mockReturnValue({ data: baseWorkspace });

    render(
      <ChatSurface workspaceId="ws_1" directory="/demo" sessionId="ses_1" />,
    );

    expect(screen.getByTestId("chat-container")).toBeInTheDocument();
    expect(screen.queryByTestId("bot-chat-container")).not.toBeInTheDocument();
  });

  test("renders BotChatContainer when workspace type is bot", () => {
    mockUseWorkspace.mockReturnValue({ data: botWorkspace });

    render(
      <ChatSurface workspaceId="ws_1" directory="/demo" sessionId="ses_1" />,
    );

    expect(screen.getByTestId("bot-chat-container")).toBeInTheDocument();
    expect(screen.queryByTestId("chat-container")).not.toBeInTheDocument();
  });

  test("falls back to ChatContainer while the workspace is still loading", () => {
    mockUseWorkspace.mockReturnValue({ data: undefined });

    render(
      <ChatSurface workspaceId="ws_1" directory="/demo" sessionId="ses_1" />,
    );

    expect(screen.getByTestId("chat-container")).toBeInTheDocument();
  });

  test("hydrates the agent selection from initialAgent and forwards updates", () => {
    mockUseWorkspace.mockReturnValue({ data: baseWorkspace });
    const onAgentChange = vi.fn();

    render(
      <ChatSurface
        workspaceId="ws_1"
        directory="/demo"
        sessionId="ses_1"
        initialAgent="plan"
        onAgentChange={onAgentChange}
      />,
    );

    expect(screen.getByTestId("chat-agent")).toHaveTextContent("plan");

    fireEvent.click(screen.getByTestId("chat-set-agent"));

    expect(onAgentChange).toHaveBeenCalledWith("build");
    expect(screen.getByTestId("chat-agent")).toHaveTextContent("build");
  });

  test("forwards model updates from ChatContainer to onModelChange", () => {
    mockUseWorkspace.mockReturnValue({ data: baseWorkspace });
    const onModelChange = vi.fn();
    const next: ModelConfig = {
      providerID: "p1",
      modelID: "m1",
      name: "Test",
      supportsStreaming: true,
      supportsTools: true,
    };

    render(
      <ChatSurface
        workspaceId="ws_1"
        directory="/demo"
        sessionId="ses_1"
        onModelChange={onModelChange}
      />,
    );

    fireEvent.click(screen.getByTestId("chat-set-model"));

    expect(onModelChange).toHaveBeenCalledWith(next);
  });

  test("forwards model updates from BotChatContainer to onModelChange", () => {
    mockUseWorkspace.mockReturnValue({ data: botWorkspace });
    const onModelChange = vi.fn();
    const next: ModelConfig = {
      providerID: "p1",
      modelID: "m1",
      name: "Test",
      supportsStreaming: true,
      supportsTools: true,
    };

    render(
      <ChatSurface
        workspaceId="ws_1"
        directory="/demo"
        sessionId="ses_1"
        onModelChange={onModelChange}
      />,
    );

    fireEvent.click(screen.getByTestId("bot-set-model"));

    expect(onModelChange).toHaveBeenCalledWith(next);
  });
});
