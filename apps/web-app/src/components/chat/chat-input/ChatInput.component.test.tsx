import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SessionStatus } from "@opencode-ai/sdk/v2";
import { ChatProvider } from "../ChatProvider";
import { ChatInput } from "./ChatInput";
import { MessageScrollerProvider } from "@/components/ui/message-scroller";

const mocks = vi.hoisted(() => ({
  sendMessage: vi.fn(),
  abort: vi.fn(),
  createSession: vi.fn(),
  executeCommand: vi.fn(),
  systemCommand: vi.fn(),
  toastError: vi.fn(),
  sessionStatuses: {} as Record<string, SessionStatus>,
  isSending: false,
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
    onChange: (next: { text: string; mentions: unknown[] }) => void;
    onKeyDown: (e: {
      key: string;
      shiftKey?: boolean;
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
      onChange={(e) => onChange({ text: e.target.value, mentions: [] })}
      onKeyDown={(e) =>
        onKeyDown({
          key: e.key,
          shiftKey: e.shiftKey,
          preventDefault: () => e.preventDefault(),
        })
      }
    />
  ),
}));

vi.mock("../ModelSelector", () => ({ ModelSelector: () => null }));
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

function pressKey(key: string, shiftKey = false) {
  const editor = screen.getByLabelText("chat-editor");
  fireEvent.keyDown(editor, { key, shiftKey });
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
      pressKey("Enter", true);
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
