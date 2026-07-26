import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { ChatContainer } from "./ChatContainer";
import type { QuestionV2Request, PermissionRequest } from "@opencode-ai/sdk/v2";

const mockToastError = vi.fn();
vi.mock("@/components/ui/sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock("@/lib/greeting-generator", () => ({
  generatePlaceholder: () => "Test placeholder",
}));

const mockExecute = vi.fn();
vi.mock("@/lib/commands", () => ({
  useSystemCommands: () => ({ commands: [], execute: mockExecute }),
  findSystemCommand: (name: string) =>
    name === "test-command" ? { name: "test-command" } : null,
}));

vi.mock("@/components/chat/message/MessageList", () => ({
  MessageList: () => <div data-testid="message-list" />,
}));

vi.mock("@/components/chat/chat-input", () => ({
  ChatInput: ({
    onSend,
    onImmediateCommand,
    isLoading,
  }: {
    onSend: (content: { text: string; mentions: unknown[] }) => void;
    onImmediateCommand?: (commandName: string) => void;
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
      <button
        data-testid="trigger-immediate-command"
        onClick={() => onImmediateCommand?.("test-command")}
      >
        trigger command
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
  PermissionDialog: ({
    permission,
  }: {
    permission?: { sessionID: string };
  }) => (
    <div
      data-testid="permission-dialog"
      data-session={permission?.sessionID ?? ""}
    />
  ),
}));

vi.mock("@/components/session/SessionPickerDialog", () => ({
  SessionPickerDialog: ({ open }: { open?: boolean }) => (
    <div data-testid="session-picker-dialog" data-open={open ?? false} />
  ),
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

const makePermission = (sessionID: string): PermissionRequest => ({
  id: `perm_${sessionID}`,
  sessionID,
  permission: "edit",
  patterns: ["**/*"],
  metadata: {},
  always: [],
  tool: { messageID: `msg_${sessionID}`, callID: `call_${sessionID}` },
});

const childrenHandler = (children: { id: string }[] = []) =>
  http.get(/\/oc\/session\/[^/]+\/children/, () => HttpResponse.json(children));

function renderChat(sessionId: string | null) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ChatContainer
        directory={DIRECTORY}
        sessionId={sessionId}
        onSessionChange={vi.fn()}
      />
    </QueryClientProvider>,
  );
}

describe("ChatCoatainer", () => {
  describe("question lookup", () => {
    let questionsData: QuestionV2Request[];

    beforeEach(() => {
      questionsData = [];
      server.use(
        http.get(/\/oc\/question(\?.*)?$/, () =>
          HttpResponse.json(questionsData),
        ),
        http.get(/\/oc\/permission(\?.*)?$/, () => HttpResponse.json([])),
        childrenHandler([]),
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

    test("shows banner for questions from a child session", async () => {
      questionsData = [makeQuestion("ses_child", 2)];
      server.use(childrenHandler([{ id: "ses_child" }]));

      renderChat("ses_parent");

      const banner = await screen.findByTestId("question-banner");
      expect(banner).toHaveAttribute("data-count", "2");
    });
  });

  describe("permission lookup", () => {
    let permissionsData: PermissionRequest[];

    beforeEach(() => {
      permissionsData = [];
      server.use(
        http.get(/\/oc\/question(\?.*)?$/, () => HttpResponse.json([])),
        http.get(/\/oc\/permission(\?.*)?$/, () =>
          HttpResponse.json(permissionsData),
        ),
        childrenHandler([]),
      );
    });

    test("renders PermissionBanner when current session has permissions", async () => {
      permissionsData = [
        makePermission("ses_active"),
        makePermission("ses_active"),
      ];

      renderChat("ses_active");

      const banner = await screen.findByTestId("permission-banner");
      expect(banner).toHaveAttribute("data-count", "2");
    });

    test("does not render banner when sessionId is null", async () => {
      permissionsData = [makePermission("ses_x")];

      renderChat(null);

      await waitFor(() =>
        expect(
          screen.queryByTestId("permission-banner"),
        ).not.toBeInTheDocument(),
      );
    });

    test("does not render banner when permission belongs to another session", async () => {
      permissionsData = [makePermission("ses_other")];

      renderChat("ses_active");

      await waitFor(() =>
        expect(
          screen.queryByTestId("permission-banner"),
        ).not.toBeInTheDocument(),
      );
    });

    test("mounts PermissionDialog when session has a permission", async () => {
      permissionsData = [makePermission("ses_active")];

      renderChat("ses_active");

      const dialog = await screen.findByTestId("permission-dialog");
      expect(dialog).toHaveAttribute("data-session", "ses_active");
    });

    test("does not mount PermissionDialog when no matching permission exists", async () => {
      permissionsData = [makePermission("ses_other")];

      renderChat("ses_active");

      await waitFor(() =>
        expect(
          screen.queryByTestId("permission-dialog"),
        ).not.toBeInTheDocument(),
      );
    });

    test("counts permissions from a child session in the banner", async () => {
      permissionsData = [
        makePermission("ses_parent"),
        makePermission("ses_child"),
      ];
      server.use(childrenHandler([{ id: "ses_child" }]));

      renderChat("ses_parent");

      const banner = await screen.findByTestId("permission-banner");
      expect(banner).toHaveAttribute("data-count", "2");
    });

    test("mounts PermissionDialog for a child session permission", async () => {
      permissionsData = [makePermission("ses_child")];
      server.use(childrenHandler([{ id: "ses_child" }]));

      renderChat("ses_parent");

      const dialog = await screen.findByTestId("permission-dialog");
      expect(dialog).toHaveAttribute("data-session", "ses_child");
    });

    test("does not count permissions from unrelated sessions", async () => {
      permissionsData = [
        makePermission("ses_parent"),
        makePermission("ses_unrelated"),
      ];
      server.use(childrenHandler([{ id: "ses_child" }]));

      renderChat("ses_parent");

      const banner = await screen.findByTestId("permission-banner");
      expect(banner).toHaveAttribute("data-count", "1");
    });
  });

  describe("send message error handling", () => {
    const SESSION_ID = "test-session-123";

    beforeEach(() => {
      vi.clearAllMocks();
      server.use(
        http.get(/\/oc\/question(\?.*)?$/, () => HttpResponse.json([])),
        http.get(/\/oc\/permission(\?.*)?$/, () => HttpResponse.json([])),
        childrenHandler([]),
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

  describe("command execution via onImmediateCommand", () => {
    beforeEach(() => {
      mockExecute.mockClear();
      server.use(
        http.get(/\/oc\/question(\?.*)?$/, () => HttpResponse.json([])),
        http.get(/\/oc\/permission(\?.*)?$/, () => HttpResponse.json([])),
        childrenHandler([]),
      );
    });

    test("executes system command when onImmediateCommand is called", async () => {
      renderChat("test-session");

      const trigger = await screen.findByTestId("trigger-immediate-command");
      trigger.click();

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledWith(
          "test-command",
          "",
          expect.objectContaining({
            directory: DIRECTORY,
            sessionId: "test-session",
          }),
        );
      });
    });

    test("opens session picker when command calls openSessionPicker", async () => {
      mockExecute.mockImplementation((_command, _args, opts) => {
        opts?.openSessionPicker?.();
      });

      renderChat("test-session");

      const trigger = await screen.findByTestId("trigger-immediate-command");
      await act(async () => {
        trigger.click();
      });

      await waitFor(() => {
        const dialog = screen.getByTestId("session-picker-dialog");
        expect(dialog).toHaveAttribute("data-open", "true");
      });
    });
  });

  describe("sessionPickerDialog visibility", () => {
    beforeEach(() => {
      server.use(
        http.get(/\/oc\/question(\?.*)?$/, () => HttpResponse.json([])),
        http.get(/\/oc\/permission(\?.*)?$/, () => HttpResponse.json([])),
        childrenHandler([]),
      );
    });

    test("renders SessionPickerDialog with open=false by default", async () => {
      renderChat("test-session");

      const dialog = await screen.findByTestId("session-picker-dialog");
      expect(dialog).toHaveAttribute("data-open", "false");
    });
  });
});
