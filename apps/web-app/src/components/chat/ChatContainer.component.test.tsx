import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test/utils";
import { server } from "@/test/server";
import { ChatContainer } from "./ChatContainer";
import type { QuestionV2Request } from "@opencode-ai/sdk/v2";

const mockToastError = vi.fn();
vi.mock("@/components/ui/sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock("@/lib/greeting-generator", () => ({
  generatePlaceholder: () => "Test placeholder",
}));

vi.mock("@/lib/commands", () => ({
  useSystemCommands: () => ({ commands: [], execute: vi.fn() }),
  findSystemCommand: () => null,
}));

vi.mock("@/components/chat/message/MessageList", () => ({
  MessageList: () => <div data-testid="message-list" />,
}));

vi.mock("@/components/chat/chat-input", () => ({
  ChatInput: ({
    onSend,
    isLoading,
  }: {
    onSend: (content: { text: string; mentions: unknown[] }) => void;
    isLoading: boolean;
  }) => (
    <div data-testid="chat-input">
      <button
        data-testid="trigger-send"
        onClick={() => onSend({ text: "hello", mentions: [] })}
        disabled={isLoading}
      >
        {isLoading ? "loading" : "send"}
      </button>
      <span data-testid="loading-state">{isLoading ? "true" : "false"}</span>
    </div>
  ),
}));

vi.mock("@/components/permission/PermissionBanner", () => ({
  PermissionBanner: ({ count }: { count: number }) => (
    <div data-testid="permission-banner" data-count={count} />
  ),
}));

vi.mock("@/components/permission/PermissionDialog", () => ({
  PermissionDialog: () => <div data-testid="permission-dialog" />,
}));

vi.mock("@/components/session/SessionPickerDialog", () => ({
  SessionPickerDialog: () => <div data-testid="session-picker-dialog" />,
}));

vi.mock("@/components/question/QuestionBanner", () => ({
  QuestionBanner: ({ count }: { count: number }) => (
    <div
      data-testid="question-banner"
      data-count={count}
    >{`${count} question${count > 1 ? "s" : ""} pending`}</div>
  ),
}));

vi.mock("@/components/question/QuestionSheet", () => ({
  QuestionSheet: () => <div data-testid="question-sheet" />,
}));

const DIRECTORY = "/demo/project";

const makeQuestion = (
  sessionID: string,
  numQuestions: number,
): QuestionV2Request => ({
  id: `que_${sessionID}`,
  sessionID,
  questions: Array.from({ length: numQuestions }, (_, i) => ({
    question: `Q${i + 1}`,
    header: `H${i + 1}`,
    options: [{ label: "opt", description: "desc" }],
    multiple: false,
  })),
  tool: { messageID: `msg_${sessionID}`, callID: `call_${sessionID}` },
});

function renderChat(sessionId: string | null) {
  return renderWithProviders(
    <ChatContainer
      directory={DIRECTORY}
      sessionId={sessionId}
      onSessionChange={vi.fn()}
    />,
  );
}

describe("ChatContainer - sessionQuestion lookup (.find)", () => {
  let questionsData: QuestionV2Request[];

  beforeEach(() => {
    questionsData = [];
    server.use(
      http.get(/\/oc\/question(\?.*)?$/, () =>
        HttpResponse.json(questionsData),
      ),
      http.get(/\/oc\/permission(\?.*)?$/, () => HttpResponse.json([])),
    );
  });

  test("renders QuestionBanner when current session has questions", async () => {
    questionsData = [makeQuestion("ses_active", 2)];

    renderChat("ses_active");

    const banner = await screen.findByTestId("question-banner");
    expect(banner).toHaveAttribute("data-count", "2");
    expect(banner).toHaveTextContent("2 questions pending");
  });

  test("only counts questions for the active session (filters by sessionID)", async () => {
    questionsData = [
      makeQuestion("ses_a", 1),
      makeQuestion("ses_b", 2),
      makeQuestion("ses_c", 3),
    ];

    renderChat("ses_b");

    const banner = await screen.findByTestId("question-banner");
    expect(banner).toHaveAttribute("data-count", "2");
  });

  test("does not render banner when sessionId is null", async () => {
    questionsData = [makeQuestion("ses_x", 1)];

    renderChat(null);

    await waitFor(() =>
      expect(screen.queryByTestId("question-banner")).not.toBeInTheDocument(),
    );
  });

  test("does not render banner when no question matches sessionId", async () => {
    questionsData = [makeQuestion("ses_other", 1)];

    renderChat("ses_unknown");

    await waitFor(() =>
      expect(screen.queryByTestId("question-banner")).not.toBeInTheDocument(),
    );
  });

  test("does not render banner when questions array is empty", async () => {
    questionsData = [];

    renderChat("ses_active");

    await waitFor(() =>
      expect(screen.queryByTestId("question-banner")).not.toBeInTheDocument(),
    );
  });

  test("mounts QuestionSheet when a matching question exists", async () => {
    questionsData = [makeQuestion("ses_active", 1)];

    renderChat("ses_active");

    await waitFor(() =>
      expect(screen.getByTestId("question-sheet")).toBeInTheDocument(),
    );
  });

  test("does not mount QuestionSheet when no matching question exists", async () => {
    questionsData = [makeQuestion("ses_other", 1)];

    renderChat("ses_active");

    await waitFor(() =>
      expect(screen.queryByTestId("question-sheet")).not.toBeInTheDocument(),
    );
  });
});

describe("ChatContainer - send message error handling", () => {
  const SESSION_ID = "test-session-123";

  beforeEach(() => {
    vi.clearAllMocks();
    server.use(
      http.get(/\/oc\/question(\?.*)?$/, () => HttpResponse.json([])),
      http.get(/\/oc\/permission(\?.*)?$/, () => HttpResponse.json([])),
    );
  });

  test("shows toast error when send message fails", async () => {
    server.use(
      http.post(/\/oc\/session\/[^/]+\/prompt_async/, () =>
        HttpResponse.json({ message: "Server exploded" }, { status: 500 }),
      ),
    );

    renderChat(SESSION_ID);

    const trigger = await screen.findByTestId("trigger-send");
    trigger.click();

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Server exploded");
    });
  });

  test("passes isLoading=true to ChatInput while sending", async () => {
    const pendingPromise = new Promise<Response>(() => {});

    server.use(
      http.post(/\/oc\/session\/[^/]+\/prompt_async/, async () => {
        await pendingPromise;
        return HttpResponse.json(null, { status: 200 });
      }),
    );

    renderChat(SESSION_ID);

    const trigger = await screen.findByTestId("trigger-send");
    trigger.click();

    await waitFor(() => {
      expect(screen.getByTestId("loading-state")).toHaveTextContent("true");
    });
  });
});
