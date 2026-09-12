import { act, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatProvider, useChat } from "./ChatProvider";
import { useDefaultAgentStore } from "@/stores/defaultAgentStore";
import { useDefaultModelStore } from "@/stores/defaultModelStore";
import type { ModelConfig } from "@/types";

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

const model: ModelConfig = {
  providerID: "openai",
  modelID: "gpt-5",
  name: "GPT-5",
  maxTokens: 128_000,
  supportsStreaming: true,
  supportsTools: true,
};

const altModel: ModelConfig = {
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

function ControlledWrapper({
  initialAgent,
  initialModel,
  onAgentChange,
  onModelChange,
}: {
  initialAgent: string | null;
  initialModel: ModelConfig | null;
  onAgentChange: (agent: string | null) => void;
  onModelChange: (model: ModelConfig | null) => void;
}) {
  const [agent, setAgent] = useState<string | null>(initialAgent);
  const [model, setModel] = useState<ModelConfig | null>(initialModel);
  return (
    <ChatProvider
      workspace={null}
      directory="/project"
      sessionId="ses_1"
      agent={agent}
      onAgentChange={(a) => {
        onAgentChange(a);
        setAgent(a);
      }}
      model={model}
      onModelChange={(m) => {
        onModelChange(m);
        setModel(m);
      }}
    >
      <ChatSelection />
    </ChatProvider>
  );
}

type ChatProviderOptions = {
  sessionId: string | null;
  onSessionChange?: (sessionId: string | null) => void;
  agent?: string | null;
  onAgentChange?: (agent: string | null) => void;
  model?: ModelConfig | null;
  onModelChange?: (model: ModelConfig | null) => void;
};

function renderChat(
  options: ChatProviderOptions,
  children: React.ReactNode = <ChatSelection />,
) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ChatProvider
        workspace={null}
        directory="/project"
        sessionId={options.sessionId}
        onSessionChange={options.onSessionChange}
        agent={options.agent}
        onAgentChange={options.onAgentChange}
        model={options.model}
        onModelChange={options.onModelChange}
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
  });

  test("uses global defaults when the session has no selection", () => {
    useDefaultAgentStore.setState({ defaultAgent: "plan" });
    useDefaultModelStore.setState({ defaultModel: model });

    renderChat({ sessionId: "ses_1" });

    expect(screen.getByTestId("agent")).toHaveTextContent("plan");
    expect(screen.getByTestId("model")).toHaveTextContent("GPT-5");
  });

  test("saves selections made before a new session exists as defaults", async () => {
    const onAgentChange = vi.fn();
    const onModelChange = vi.fn();
    renderChat({
      sessionId: null,
      onAgentChange,
      onModelChange,
    });

    await act(async () => {
      screen.getByRole("button", { name: "Select agent" }).click();
      screen.getByRole("button", { name: "Select model" }).click();
    });

    expect(onAgentChange).toHaveBeenCalledWith("build");
    expect(onModelChange).toHaveBeenCalledWith(model);
  });

  test("uses and updates selections scoped to the active session", async () => {
    useDefaultAgentStore.setState({ defaultAgent: "plan" });
    useDefaultModelStore.setState({ defaultModel: model });

    const onAgentChange = vi.fn();
    const onModelChange = vi.fn();

    renderChat({
      sessionId: "ses_1",
      agent: "explore",
      model: altModel,
      onAgentChange,
      onModelChange,
    });

    expect(screen.getByTestId("agent")).toHaveTextContent("explore");
    expect(screen.getByTestId("model")).toHaveTextContent("Claude Sonnet");

    await act(async () => {
      screen.getByRole("button", { name: "Select agent" }).click();
      screen.getByRole("button", { name: "Select model" }).click();
    });

    expect(onAgentChange).toHaveBeenCalledWith("build");
    expect(onModelChange).toHaveBeenCalledWith(model);
    expect(useDefaultAgentStore.getState().defaultAgent).toBe("plan");
    expect(useDefaultModelStore.getState().defaultModel).toEqual(model);
  });

  test("returns each session field to its global default independently", async () => {
    useDefaultAgentStore.setState({ defaultAgent: "plan" });
    useDefaultModelStore.setState({ defaultModel: model });

    const onAgentChange = vi.fn();
    const onModelChange = vi.fn();

    const { rerender } = render(
      <QueryClientProvider client={new QueryClient()}>
        <ControlledWrapper
          initialAgent="explore"
          initialModel={altModel}
          onAgentChange={onAgentChange}
          onModelChange={onModelChange}
        />
      </QueryClientProvider>,
    );

    await act(async () => {
      screen.getByRole("button", { name: "Use default agent" }).click();
    });

    expect(screen.getByTestId("agent")).toHaveTextContent("plan");
    expect(screen.getByTestId("model")).toHaveTextContent("Claude Sonnet");
    expect(onAgentChange).toHaveBeenCalledWith(null);

    await act(async () => {
      screen.getByRole("button", { name: "Use default model" }).click();
    });

    expect(screen.getByTestId("model")).toHaveTextContent("GPT-5");
    expect(onModelChange).toHaveBeenCalledWith(null);
    rerender(<></>);
  });

  test("does not apply one session's selection to another session", async () => {
    const onAgentChange = vi.fn();
    const onModelChange = vi.fn();

    const { rerender } = renderChat({
      sessionId: "ses_1",
      onAgentChange,
      onModelChange,
    });

    await act(async () => {
      screen.getByRole("button", { name: "Select agent" }).click();
      screen.getByRole("button", { name: "Select model" }).click();
    });

    expect(onAgentChange).toHaveBeenCalledWith("build");
    expect(onModelChange).toHaveBeenCalledWith(model);

    onAgentChange.mockClear();
    onModelChange.mockClear();

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <ChatProvider
          workspace={null}
          directory="/project"
          sessionId="ses_2"
          onAgentChange={onAgentChange}
          onModelChange={onModelChange}
        >
          <ChatSelection />
        </ChatProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId("agent")).toBeEmptyDOMElement();
    expect(screen.getByTestId("model")).toBeEmptyDOMElement();
    expect(onAgentChange).not.toHaveBeenCalled();
    expect(onModelChange).not.toHaveBeenCalled();
  });

  test("creates a session before sending a message", async () => {
    const onSessionChange = vi.fn();
    renderChat({ sessionId: null, onSessionChange }, <ChatActions />);

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
    renderChat({ sessionId: "ses_1" }, <ChatActions />);

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
    renderChat({ sessionId: "ses_1" }, <ChatActions />);

    screen.getByRole("button", { name: "Run immediate command" }).click();

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith("Command exploded");
    });
  });

  test("owns session picker state and delegates session changes", async () => {
    const onSessionChange = vi.fn();
    renderChat({ sessionId: "ses_1", onSessionChange }, <ChatActions />);

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

  test("uncontrolled mode owns local state when no handler is provided", async () => {
    renderChat({ sessionId: "ses_1" });

    await act(async () => {
      screen.getByRole("button", { name: "Select agent" }).click();
    });

    expect(screen.getByTestId("agent")).toHaveTextContent("build");

    await act(async () => {
      screen.getByRole("button", { name: "Use default agent" }).click();
    });

    expect(screen.getByTestId("agent")).toBeEmptyDOMElement();
  });
});
