import { describe, expect, test, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SessionStatus } from "@opencode-ai/sdk/v2";
import { ChatProvider } from "../ChatProvider";
import { ChatInput } from "./ChatInput";
import { MessageScrollerProvider } from "@/components/ui/message-scroller";
import { useDefaultAgentStore } from "@/stores/defaultAgentStore";
import { useSessionAgentModelStore } from "@/stores/sessionAgentModelStore";
import { useChatInputHistoryStore } from "@/stores/chatInputHistoryStore";

const mocks = vi.hoisted(() => ({
  sendMessage: vi.fn(),
  abort: vi.fn(),
  createSession: vi.fn(),
  executeCommand: vi.fn(),
  systemCommand: vi.fn(),
  toastError: vi.fn(),
  sessionStatuses: {} as Record<string, SessionStatus>,
  isSending: false,
  agents: ["build", "plan", "explore"] as string[],
}));

vi.mock("@/hooks/queries/useMessages", () => ({
  useAbortGeneration: () => ({ mutate: mocks.abort, isPending: false }),
  useSendMessage: () => ({
    mutateAsync: mocks.sendMessage,
    get isPending() {
      return mocks.isSending;
    },
  }),
}));

vi.mock("@/hooks/queries/useAgents", () => ({
  useAgents: () => ({ data: mocks.agents.map((name) => ({ name })) }),
}));

vi.mock("@/hooks/queries/useCommand", () => ({
  useExecuteCommand: () => ({ mutateAsync: mocks.executeCommand }),
}));

vi.mock("@/hooks/queries/useSessions", () => ({
  useCreateSession: () => ({ mutateAsync: mocks.createSession }),
  useSessionStatuses: () => ({ data: mocks.sessionStatuses }),
}));

vi.mock("@/lib/commands", () => ({
  findSystemCommand: () => null,
  useSystemCommands: () => ({ execute: mocks.systemCommand }),
}));

vi.mock("@/components/ui/sonner", () => ({
  toast: { error: mocks.toastError },
}));

vi.mock("./ChatInputEditor", () => ({
  ChatInputEditor: ({
    content,
    onChange,
    onKeyDown,
    disabled,
  }: {
    content: { text: string };
    onChange: (next: {
      text: string;
      mentions: unknown[];
      attachments: unknown[];
    }) => void;
    onKeyDown: (e: {
      key: string;
      shiftKey?: boolean;
      metaKey?: boolean;
      ctrlKey?: boolean;
      preventDefault?: () => void;
    }) => void;
    placeholder?: string;
    disabled?: boolean;
    directory?: string;
  }) => (
    <input
      type="text"
      aria-label="chat-editor"
      disabled={disabled}
      value={content.text}
      onChange={(e) =>
        onChange({ text: e.target.value, mentions: [], attachments: [] })
      }
      onKeyDown={(e) =>
        onKeyDown({
          key: e.key,
          shiftKey: e.shiftKey,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          preventDefault: () => e.preventDefault(),
        })
      }
    />
  ),
}));

vi.mock("../ModelSelector", () => ({
  ModelSelector: ({ open }: { open?: boolean }) => (
    <div data-testid="model-selector" data-open={open ? "true" : "false"} />
  ),
}));
vi.mock("../AgentSelector", () => ({ AgentSelector: () => null }));
vi.mock("./SpeechBtn", () => ({ default: () => null }));

const SESSION_ID = "ses_test";

function renderInput(initialValue?: string) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChatProvider workspace={null} directory="/proj" sessionId={SESSION_ID}>
        <MessageScrollerProvider autoScroll>
          <ChatInput initialValue={initialValue} />
        </MessageScrollerProvider>
      </ChatProvider>
    </QueryClientProvider>,
  );
}

function setStatus(status: SessionStatus) {
  mocks.sessionStatuses = { [SESSION_ID]: status };
}

function typeText(text: string) {
  const editor = screen.getByLabelText("chat-editor");
  fireEvent.change(editor, { target: { value: text } });
}

function pressKey(
  key: string,
  opts: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean } = {},
) {
  const editor = screen.getByLabelText("chat-editor");
  fireEvent.keyDown(editor, { key, ...opts });
}

describe("ChatInput — abort/send button behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSending = false;
    mocks.sessionStatuses = {};
    mocks.sendMessage.mockResolvedValue(undefined);
  });

  describe("idle session", () => {
    beforeEach(() => setStatus({ type: "idle" }));

    test("shows disabled Send button when input is empty", () => {
      renderInput();
      const send = screen.getByRole("button", { name: "Send message" });
      expect(send).toBeDisabled();
    });

    test("does not render an abort button", () => {
      renderInput();
      expect(
        screen.queryByRole("button", { name: "Stop generating" }),
      ).not.toBeInTheDocument();
    });

    test("enables Send after typing", () => {
      renderInput();
      typeText("hello");
      expect(
        screen.getByRole("button", { name: "Send message" }),
      ).toBeEnabled();
    });

    test("disables Send again when text is cleared", () => {
      renderInput();
      typeText("hello");
      typeText("");
      expect(
        screen.getByRole("button", { name: "Send message" }),
      ).toBeDisabled();
    });

    test("calls sendMessage on click", async () => {
      renderInput();
      typeText("hello");
      await act(async () => {
        screen.getByRole("button", { name: "Send message" }).click();
      });
      expect(mocks.sendMessage).toHaveBeenCalledOnce();
    });
  });

  describe("streaming session (busy)", () => {
    beforeEach(() => setStatus({ type: "busy" }));

    test("shows Abort button when input is empty", () => {
      renderInput();
      expect(
        screen.getByRole("button", { name: "Stop generating" }),
      ).toBeInTheDocument();
    });

    test("does not render a Send button when input is empty", () => {
      renderInput();
      expect(
        screen.queryByRole("button", { name: "Send message" }),
      ).not.toBeInTheDocument();
    });

    test("swaps to Send button once text is entered (queue path)", () => {
      renderInput();
      typeText("queued follow-up");
      expect(
        screen.queryByRole("button", { name: "Stop generating" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Send message" }),
      ).toBeEnabled();
    });

    test("queues a message by clicking Send while streaming", async () => {
      renderInput();
      typeText("queued follow-up");
      await act(async () => {
        screen.getByRole("button", { name: "Send message" }).click();
      });
      expect(mocks.sendMessage).toHaveBeenCalledOnce();
    });

    test("queues a message via Enter key while streaming", async () => {
      renderInput();
      typeText("queued follow-up");
      await act(async () => {
        pressKey("Enter");
      });
      expect(mocks.sendMessage).toHaveBeenCalledOnce();
    });

    test("clicking Abort calls abortGeneration", async () => {
      renderInput();
      await act(async () => {
        screen.getByRole("button", { name: "Stop generating" }).click();
      });
      expect(mocks.abort).toHaveBeenCalledOnce();
    });

    test("Shift+Enter does not send (new line)", async () => {
      renderInput();
      typeText("queued");
      pressKey("Enter", { shiftKey: true });
      expect(mocks.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe("sending mutation in-flight (isSending)", () => {
    beforeEach(() => {
      setStatus({ type: "idle" });
      mocks.isSending = true;
    });

    test("disables the editor while the mutation is pending", () => {
      renderInput();
      expect(screen.getByLabelText("chat-editor")).toBeDisabled();
    });

    test("blocks Send click when text was pre-filled but a send is in-flight", async () => {
      renderInput("prefilled message");
      await act(async () => {
        screen.getByRole("button", { name: "Send message" }).click();
      });
      expect(mocks.sendMessage).not.toHaveBeenCalled();
    });

    test("blocks Enter-to-send when text was pre-filled but a send is in-flight", async () => {
      renderInput("prefilled message");
      await act(async () => {
        pressKey("Enter");
      });
      expect(mocks.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe("retry status behaves like streaming", () => {
    beforeEach(() =>
      setStatus({
        type: "retry",
        attempt: 1,
        message: "Retrying",
        next: Date.now() + 5000,
      }),
    );

    test("shows Abort button when input is empty", () => {
      renderInput();
      expect(
        screen.getByRole("button", { name: "Stop generating" }),
      ).toBeInTheDocument();
    });
  });

  describe("no session status (undefined)", () => {
    beforeEach(() => {
      mocks.sessionStatuses = {};
    });

    test("falls back to Send button when status is unknown", () => {
      renderInput();
      expect(
        screen.queryByRole("button", { name: "Stop generating" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Send message" }),
      ).toBeInTheDocument();
    });
  });
});

describe("ChatInput — Tab cycles agents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSending = false;
    mocks.agents = ["build", "plan", "explore"];
    mocks.sessionStatuses = { [SESSION_ID]: { type: "idle" } };
    mocks.sendMessage.mockResolvedValue(undefined);
    useDefaultAgentStore.setState({ defaultAgent: null });
    useSessionAgentModelStore.setState({ sessions: {} });
  });

  test("Tab from default (null) selects first agent", () => {
    renderInput();
    pressKey("Tab");
    expect(
      useSessionAgentModelStore.getState().sessions[SESSION_ID]?.agent,
    ).toBe("build");
  });

  test("Tab advances to next agent", () => {
    useSessionAgentModelStore.getState().setSessionAgent(SESSION_ID, "build");
    renderInput();
    pressKey("Tab");
    expect(
      useSessionAgentModelStore.getState().sessions[SESSION_ID]?.agent,
    ).toBe("plan");
  });

  test("Tab wraps from last to first", () => {
    useSessionAgentModelStore.getState().setSessionAgent(SESSION_ID, "explore");
    renderInput();
    pressKey("Tab");
    expect(
      useSessionAgentModelStore.getState().sessions[SESSION_ID]?.agent,
    ).toBe("build");
  });

  test("Shift+Tab goes backward", () => {
    useSessionAgentModelStore.getState().setSessionAgent(SESSION_ID, "plan");
    renderInput();
    pressKey("Tab", { shiftKey: true });
    expect(
      useSessionAgentModelStore.getState().sessions[SESSION_ID]?.agent,
    ).toBe("build");
  });

  test("Shift+Tab wraps from first to last", () => {
    useSessionAgentModelStore.getState().setSessionAgent(SESSION_ID, "build");
    renderInput();
    pressKey("Tab", { shiftKey: true });
    expect(
      useSessionAgentModelStore.getState().sessions[SESSION_ID]?.agent,
    ).toBe("explore");
  });

  test("Tab is a no-op when agent list is empty (no setAgent call)", () => {
    mocks.agents = [];
    renderInput();
    pressKey("Tab");
    expect(
      useSessionAgentModelStore.getState().sessions[SESSION_ID],
    ).toBeUndefined();
  });

  test("Tab does not send a message", async () => {
    renderInput();
    typeText("hello");
    await act(async () => {
      pressKey("Tab");
    });
    expect(mocks.sendMessage).not.toHaveBeenCalled();
  });
});

describe("ChatInput — Cmd/Ctrl + M opens model dropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sessionStatuses = { [SESSION_ID]: { type: "idle" } };
  });

  test("Cmd+M opens the model selector", () => {
    renderInput();
    pressKey("m", { metaKey: true });
    expect(screen.getByTestId("model-selector")).toHaveAttribute(
      "data-open",
      "true",
    );
  });

  test("Ctrl+M opens the model selector", () => {
    renderInput();
    pressKey("m", { ctrlKey: true });
    expect(screen.getByTestId("model-selector")).toHaveAttribute(
      "data-open",
      "true",
    );
  });

  test("plain M does not open the dropdown", () => {
    renderInput();
    pressKey("m");
    expect(screen.getByTestId("model-selector")).toHaveAttribute(
      "data-open",
      "false",
    );
  });

  test("Cmd+M does not send a message", async () => {
    renderInput();
    typeText("hello");
    await act(async () => {
      pressKey("m", { metaKey: true });
    });
    expect(mocks.sendMessage).not.toHaveBeenCalled();
  });
});

describe("ChatInput — input history navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSending = false;
    mocks.sessionStatuses = { [SESSION_ID]: { type: "idle" } };
    mocks.sendMessage.mockResolvedValue(undefined);
    useChatInputHistoryStore.setState({ sessions: {} });
  });

  test("ArrowUp recalls the most recent entry", async () => {
    useChatInputHistoryStore.getState().addEntry(SESSION_ID, "previous prompt");
    renderInput();
    await act(async () => {
      pressKey("ArrowUp");
    });
    expect(screen.getByLabelText("chat-editor")).toHaveValue("previous prompt");
  });

  test("ArrowUp walks older entries, ArrowDown walks back", async () => {
    useChatInputHistoryStore.getState().addEntry(SESSION_ID, "first");
    useChatInputHistoryStore.getState().addEntry(SESSION_ID, "second");
    renderInput();

    await act(async () => {
      pressKey("ArrowUp");
    });
    expect(screen.getByLabelText("chat-editor")).toHaveValue("second");

    await act(async () => {
      pressKey("ArrowUp");
    });
    expect(screen.getByLabelText("chat-editor")).toHaveValue("first");

    await act(async () => {
      pressKey("ArrowDown");
    });
    expect(screen.getByLabelText("chat-editor")).toHaveValue("second");
  });

  test("ArrowDown past the newest entry clears the input", async () => {
    useChatInputHistoryStore.getState().addEntry(SESSION_ID, "only");
    renderInput();
    await act(async () => {
      pressKey("ArrowUp");
    });
    await act(async () => {
      pressKey("ArrowDown");
    });
    expect(screen.getByLabelText("chat-editor")).toHaveValue("");
  });

  test("ArrowUp is a no-op when history is empty", async () => {
    renderInput();
    await act(async () => {
      pressKey("ArrowUp");
    });
    expect(screen.getByLabelText("chat-editor")).toHaveValue("");
  });

  test("editing after recall disables history navigation", async () => {
    useChatInputHistoryStore.getState().addEntry(SESSION_ID, "recalled");
    renderInput();
    await act(async () => {
      pressKey("ArrowUp");
    });
    // user edits — input no longer matches the history selection
    typeText("recalled!");
    await act(async () => {
      pressKey("ArrowUp");
    });
    expect(screen.getByLabelText("chat-editor")).toHaveValue("recalled!");
  });
});

describe("ChatInput — image attachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSending = false;
    mocks.sessionStatuses = { [SESSION_ID]: { type: "idle" } };
    mocks.sendMessage.mockResolvedValue(undefined);
  });

  function focusEditor() {
    act(() => {
      fireEvent.focus(screen.getByLabelText("chat-editor"));
    });
  }

  function pickFile(file: File) {
    focusEditor();
    const input = screen.getByLabelText("Attach image files");
    fireEvent.change(input, { target: { files: [file] } });
  }

  test("picking an image file adds a chip", async () => {
    renderInput();
    pickFile(new File(["x"], "photo.png", { type: "image/png" }));

    await waitFor(() =>
      expect(screen.getByAltText("photo.png")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("attachment-preview")).toBeInTheDocument();
  });

  test("picking a non-image file does not add a chip and shows a toast", async () => {
    renderInput();
    pickFile(new File(["x"], "notes.txt", { type: "text/plain" }));

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        "Only image files can be attached",
      ),
    );
    expect(screen.queryByTestId("attachment-preview")).not.toBeInTheDocument();
  });

  test("clicking the X on a chip removes the attachment", async () => {
    renderInput();
    pickFile(new File(["x"], "photo.png", { type: "image/png" }));

    await waitFor(() =>
      expect(screen.getByAltText("photo.png")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove photo.png" }));

    await waitFor(() =>
      expect(screen.queryByAltText("photo.png")).not.toBeInTheDocument(),
    );
    expect(screen.queryByTestId("attachment-preview")).not.toBeInTheDocument();
  });

  test("submitting with attachments only (no text) sends and clears attachments", async () => {
    renderInput();
    pickFile(new File(["x"], "photo.png", { type: "image/png" }));

    await waitFor(() =>
      expect(screen.getByAltText("photo.png")).toBeInTheDocument(),
    );

    await act(async () => {
      screen.getByRole("button", { name: "Send message" }).click();
    });

    expect(mocks.sendMessage).toHaveBeenCalledOnce();
    const sent = mocks.sendMessage.mock.calls[0]?.[0] as {
      content: { attachments: { filename: string }[] };
    };
    expect(sent?.content.attachments).toHaveLength(1);
    expect(sent?.content.attachments[0]?.filename).toBe("photo.png");

    await waitFor(() =>
      expect(screen.queryByAltText("photo.png")).not.toBeInTheDocument(),
    );
  });
});
