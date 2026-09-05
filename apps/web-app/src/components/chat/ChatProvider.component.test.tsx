import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatProvider, useChat } from "./ChatProvider";
import { useDefaultAgentStore } from "@/stores/defaultAgentStore";
import { useDefaultModelStore } from "@/stores/defaultModelStore";
import { useSessionAgentModelStore } from "@/stores/sessionAgentModelStore";

const mocks = vi.hoisted(() => ({
  abort: vi.fn(),
  createSession: vi.fn(),
  executeCommand: vi.fn(),
  sendMessage: vi.fn(),
  systemCommand: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/hooks/queries/useMessages", () => ({
  useAbortGeneration: () => ({ mutate: mocks.abort, isPending: false }),
  useSendMessage: () => ({ mutateAsync: mocks.sendMessage, isPending: false }),
}));

vi.mock("@/hooks/queries/useCommand", () => ({
  useExecuteCommand: () => ({ mutateAsync: mocks.executeCommand }),
}));

vi.mock("@/hooks/queries/useSessions", () => ({
  useCreateSession: () => ({ mutateAsync: mocks.createSession }),
  useSessionStatuses: () => ({ data: {} }),
}));

vi.mock("@/lib/commands", () => ({
  findSystemCommand: (name: string) =>
    name === "test-command" ? { name: "test-command" } : null,
  useSystemCommands: () => ({ execute: mocks.systemCommand }),
}));

vi.mock("@/components/ui/sonner", () => ({
  toast: { error: mocks.toastError },
}));

const model = {
  providerID: "openai",
  modelID: "gpt-5",
  name: "GPT-5",
  maxTokens: 128_000,
  supportsStreaming: true,
  supportsTools: true,
};

const sessionModel = {
  ...model,
  modelID: "claude-sonnet",
  name: "Claude Sonnet",
};

function ChatSelection() {
  const { effectiveAgent, effectiveModel, setAgent, setModel } = useChat();

  return (
    <>
      <span data-testid="agent">{effectiveAgent}</span>
      <span data-testid="model">{effectiveModel?.name}</span>
      <button onClick={() => setAgent("build")}>Select agent</button>
      <button onClick={() => setModel(model)}>Select model</button>
      <button onClick={() => setAgent(null)}>Use default agent</button>
      <button onClick={() => setModel(null)}>Use default model</button>
    </>
  );
}

function ChatActions() {
  const {
    changeSession,
    executeImmediateCommand,
    openSessionPicker,
    sendMessage,
    sessionPickerOpen,
    setSessionPickerOpen,
  } = useChat();

  return (
    <>
      <button
        onClick={() =>
          void sendMessage({ text: "hello", mentions: [], attachments: [] })
        }
      >
        Send message
      </button>
      <button
        onClick={() =>
          void sendMessage({
            text: "/test-command",
            mentions: [],
            attachments: [],
          })
        }
      >
        Send slash command
      </button>
      <button onClick={() => void executeImmediateCommand("test-command")}>
        Run immediate command
      </button>
      <button onClick={openSessionPicker}>Open session picker</button>
      <button onClick={() => setSessionPickerOpen(false)}>
        Close session picker
      </button>
      <button onClick={() => changeSession("ses_next")}>Change session</button>
      <span data-testid="picker-open">{String(sessionPickerOpen)}</span>
    </>
  );
}

function renderChat(
  sessionId: string | null,
  children = <ChatSelection />,
  onSessionChange?: (sessionId: string | null) => void,
) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ChatProvider
        workspace={null}
        directory="/project"
        sessionId={sessionId}
        onSessionChange={onSessionChange}
      >
        {children}
      </ChatProvider>
    </QueryClientProvider>,
  );
}

describe("ChatProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createSession.mockResolvedValue({ id: "ses_created" });
    mocks.executeCommand.mockResolvedValue(undefined);
    mocks.sendMessage.mockResolvedValue(undefined);
    mocks.systemCommand.mockResolvedValue(undefined);
    useDefaultAgentStore.setState({ defaultAgent: null });
    useDefaultModelStore.setState({ defaultModel: null });
    useSessionAgentModelStore.setState({ sessions: {} });
  });

  test("uses global defaults when the session has no selection", () => {
    useDefaultAgentStore.setState({ defaultAgent: "plan" });
    useDefaultModelStore.setState({ defaultModel: model });

    renderChat("ses_1");

    expect(screen.getByTestId("agent")).toHaveTextContent("plan");
    expect(screen.getByTestId("model")).toHaveTextContent("GPT-5");
  });

  test("saves selections made before a new session exists as defaults", async () => {
    renderChat(null);

    await act(async () => {
      screen.getByRole("button", { name: "Select agent" }).click();
      screen.getByRole("button", { name: "Select model" }).click();
    });

    expect(screen.getByTestId("agent")).toHaveTextContent("build");
    expect(screen.getByTestId("model")).toHaveTextContent("GPT-5");
    expect(useDefaultAgentStore.getState().defaultAgent).toBe("build");
    expect(useDefaultModelStore.getState().defaultModel).toEqual(model);
  });

  test("uses and updates selections scoped to the active session", async () => {
    useDefaultAgentStore.setState({ defaultAgent: "plan" });
    useDefaultModelStore.setState({ defaultModel: model });
    useSessionAgentModelStore.setState({
      sessions: { ses_1: { agent: "explore", model: sessionModel } },
    });

    renderChat("ses_1");

    expect(screen.getByTestId("agent")).toHaveTextContent("explore");
    expect(screen.getByTestId("model")).toHaveTextContent("Claude Sonnet");

    await act(async () => {
      screen.getByRole("button", { name: "Select agent" }).click();
      screen.getByRole("button", { name: "Select model" }).click();
    });

    expect(useSessionAgentModelStore.getState().sessions.ses_1).toEqual({
      agent: "build",
      model,
    });
    expect(useDefaultAgentStore.getState().defaultAgent).toBe("plan");
    expect(useDefaultModelStore.getState().defaultModel).toEqual(model);
  });

  test("returns each session field to its global default independently", async () => {
    useDefaultAgentStore.setState({ defaultAgent: "plan" });
    useDefaultModelStore.setState({ defaultModel: model });
    useSessionAgentModelStore.setState({
      sessions: { ses_1: { agent: "explore", model: sessionModel } },
    });

    renderChat("ses_1");

    await act(async () => {
      screen.getByRole("button", { name: "Use default agent" }).click();
    });

    expect(screen.getByTestId("agent")).toHaveTextContent("plan");
    expect(screen.getByTestId("model")).toHaveTextContent("Claude Sonnet");
    expect(useSessionAgentModelStore.getState().sessions.ses_1).toEqual({
      model: sessionModel,
    });

    await act(async () => {
      screen.getByRole("button", { name: "Use default model" }).click();
    });

    expect(screen.getByTestId("model")).toHaveTextContent("GPT-5");
    expect(useSessionAgentModelStore.getState().sessions.ses_1).toBeUndefined();
  });

  test("does not apply one session's selection to another session", async () => {
    const { rerender } = renderChat("ses_1");

    await act(async () => {
      screen.getByRole("button", { name: "Select agent" }).click();
      screen.getByRole("button", { name: "Select model" }).click();
    });

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <ChatProvider workspace={null} directory="/project" sessionId="ses_2">
          <ChatSelection />
        </ChatProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId("agent")).toBeEmptyDOMElement();
    expect(screen.getByTestId("model")).toBeEmptyDOMElement();
    expect(useSessionAgentModelStore.getState().sessions.ses_1).toEqual({
      agent: "build",
      model,
    });
    expect(useSessionAgentModelStore.getState().sessions.ses_2).toBeUndefined();
  });

  test("creates a session before sending a message", async () => {
    const onSessionChange = vi.fn();
    renderChat(null, <ChatActions />, onSessionChange);

    await act(async () => {
      screen.getByRole("button", { name: "Send message" }).click();
    });

    expect(mocks.createSession).toHaveBeenCalledWith({ directory: "/project" });
    expect(onSessionChange).toHaveBeenCalledWith("ses_created");
    expect(mocks.sendMessage).toHaveBeenCalledWith({
      sessionId: "ses_created",
      content: { text: "hello", mentions: [], attachments: [] },
      directory: "/project",
      model: undefined,
      agent: undefined,
    });
  });

  test("awaits system commands dispatched from slash messages", async () => {
    renderChat("ses_1", <ChatActions />);

    await act(async () => {
      screen.getByRole("button", { name: "Send slash command" }).click();
    });

    expect(mocks.systemCommand).toHaveBeenCalledWith(
      "test-command",
      "",
      expect.objectContaining({
        directory: "/project",
        sessionId: "ses_1",
      }),
    );
  });

  test("reports failures from immediate commands", async () => {
    mocks.systemCommand.mockRejectedValueOnce(new Error("Command exploded"));
    renderChat("ses_1", <ChatActions />);

    screen.getByRole("button", { name: "Run immediate command" }).click();

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith("Command exploded");
    });
  });

  test("owns session picker state and delegates session changes", async () => {
    const onSessionChange = vi.fn();
    renderChat("ses_1", <ChatActions />, onSessionChange);

    expect(screen.getByTestId("picker-open")).toHaveTextContent("false");

    await act(async () => {
      screen.getByRole("button", { name: "Open session picker" }).click();
    });

    expect(screen.getByTestId("picker-open")).toHaveTextContent("true");

    await act(async () => {
      screen.getByRole("button", { name: "Change session" }).click();
    });

    expect(onSessionChange).toHaveBeenCalledWith("ses_next");
  });
});
