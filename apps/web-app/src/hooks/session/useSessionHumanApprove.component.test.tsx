import { describe, test, expect, beforeEach } from "vitest";
import { waitFor, renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type {
  QuestionRequest,
  PermissionRequest,
  Session,
} from "@opencode-ai/sdk/v2";
import { server } from "@/test/server";
import { useSessionData } from "./useSessionHumanApprove";

const DEMO_DIRECTORY = "/demo/project";
const MAIN_SESSION = "ses_main";
const CHILD_SESSION_1 = "ses_child1";
const CHILD_SESSION_2 = "ses_child2";
const UNRELATED_SESSION = "ses_unrelated";

const createMockQuestion = (
  overrides?: Partial<QuestionRequest>,
): QuestionRequest => ({
  id: "que_default",
  sessionID: MAIN_SESSION,
  questions: [],
  ...overrides,
});

const createMockPermission = (
  overrides?: Partial<PermissionRequest>,
): PermissionRequest => ({
  id: "per_default",
  sessionID: MAIN_SESSION,
  permission: "read",
  patterns: [],
  metadata: {},
  always: [],
  ...overrides,
});

const createMockSession = (overrides?: Partial<Session>): Session => ({
  id: "ses_default",
  slug: "default",
  projectID: "proj_default",
  directory: DEMO_DIRECTORY,
  title: "Default Session",
  version: "1.0.0",
  time: { created: 0, updated: 0 },
  ...overrides,
});

const mockQuestions: QuestionRequest[] = [
  createMockQuestion({ id: "que_main", sessionID: MAIN_SESSION }),
  createMockQuestion({ id: "que_child1", sessionID: CHILD_SESSION_1 }),
  createMockQuestion({ id: "que_unrelated", sessionID: UNRELATED_SESSION }),
];

const mockPermissions: PermissionRequest[] = [
  createMockPermission({ id: "per_main", sessionID: MAIN_SESSION }),
  createMockPermission({ id: "per_child2", sessionID: CHILD_SESSION_2 }),
  createMockPermission({
    id: "per_unrelated",
    sessionID: UNRELATED_SESSION,
  }),
];

const mockChildSessions: Session[] = [
  createMockSession({ id: CHILD_SESSION_1, title: "Child 1" }),
  createMockSession({ id: CHILD_SESSION_2, title: "Child 2" }),
];

function renderHookWithProviders<T>(hook: () => T) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(hook, { wrapper });
}

function setupDefaultHandlers(overrides?: {
  questions?: QuestionRequest[];
  permissions?: PermissionRequest[];
  children?: Session[];
}) {
  server.use(
    http.get(/\/question(\?|$)/, () =>
      HttpResponse.json(overrides?.questions ?? mockQuestions),
    ),
    http.get(/\/permission(\?|$)/, () =>
      HttpResponse.json(overrides?.permissions ?? mockPermissions),
    ),
    http.get(/\/session\/([^/]+)\/children/, () =>
      HttpResponse.json(overrides?.children ?? mockChildSessions),
    ),
  );
}

describe("useSessionData", () => {
  beforeEach(() => {
    setupDefaultHandlers();
  });

  describe("raw data passthrough", () => {
    test("returns all questions from the API", async () => {
      const { result } = renderHookWithProviders(() =>
        useSessionData({
          directory: DEMO_DIRECTORY,
          sessionId: MAIN_SESSION,
        }),
      );

      await waitFor(() => {
        expect(result.current.questions).toHaveLength(3);
      });
      expect(result.current.questions.map((q) => q.id)).toEqual([
        "que_main",
        "que_child1",
        "que_unrelated",
      ]);
    });

    test("returns all permissions from the API", async () => {
      const { result } = renderHookWithProviders(() =>
        useSessionData({
          directory: DEMO_DIRECTORY,
          sessionId: MAIN_SESSION,
        }),
      );

      await waitFor(() => {
        expect(result.current.permissions).toHaveLength(3);
      });
      expect(result.current.permissions.map((p) => p.id)).toEqual([
        "per_main",
        "per_child2",
        "per_unrelated",
      ]);
    });
  });

  describe("filtering by session relations", () => {
    test("includes questions from the main session", async () => {
      const { result } = renderHookWithProviders(() =>
        useSessionData({
          directory: DEMO_DIRECTORY,
          sessionId: MAIN_SESSION,
        }),
      );

      await waitFor(() => {
        expect(result.current.sessionQuestions).toHaveLength(2);
      });
      const ids = result.current.sessionQuestions.map((q) => q.id);
      expect(ids).toContain("que_main");
      expect(ids).not.toContain("que_unrelated");
    });

    test("includes questions from child sessions", async () => {
      const { result } = renderHookWithProviders(() =>
        useSessionData({
          directory: DEMO_DIRECTORY,
          sessionId: MAIN_SESSION,
        }),
      );

      await waitFor(() => {
        expect(result.current.sessionQuestions).toHaveLength(2);
      });
      expect(
        result.current.sessionQuestions.some((q) => q.id === "que_child1"),
      ).toBe(true);
    });

    test("excludes questions from unrelated sessions", async () => {
      const { result } = renderHookWithProviders(() =>
        useSessionData({
          directory: DEMO_DIRECTORY,
          sessionId: MAIN_SESSION,
        }),
      );

      await waitFor(() => {
        expect(result.current.sessionQuestions).toHaveLength(2);
      });
      expect(
        result.current.sessionQuestions.every(
          (q) => q.sessionID !== UNRELATED_SESSION,
        ),
      ).toBe(true);
    });

    test("includes permissions from the main session", async () => {
      const { result } = renderHookWithProviders(() =>
        useSessionData({
          directory: DEMO_DIRECTORY,
          sessionId: MAIN_SESSION,
        }),
      );

      await waitFor(() => {
        expect(result.current.sessionPermissions).toHaveLength(2);
      });
      expect(
        result.current.sessionPermissions.some((p) => p.id === "per_main"),
      ).toBe(true);
    });

    test("includes permissions from child sessions", async () => {
      const { result } = renderHookWithProviders(() =>
        useSessionData({
          directory: DEMO_DIRECTORY,
          sessionId: MAIN_SESSION,
        }),
      );

      await waitFor(() => {
        expect(result.current.sessionPermissions).toHaveLength(2);
      });
      expect(
        result.current.sessionPermissions.some((p) => p.id === "per_child2"),
      ).toBe(true);
    });

    test("excludes permissions from unrelated sessions", async () => {
      const { result } = renderHookWithProviders(() =>
        useSessionData({
          directory: DEMO_DIRECTORY,
          sessionId: MAIN_SESSION,
        }),
      );

      await waitFor(() => {
        expect(result.current.sessionPermissions).toHaveLength(2);
      });
      expect(
        result.current.sessionPermissions.every(
          (p) => p.sessionID !== UNRELATED_SESSION,
        ),
      ).toBe(true);
    });
  });

  describe("current question and permission", () => {
    test("currentQuestion is the first matching session question", async () => {
      const { result } = renderHookWithProviders(() =>
        useSessionData({
          directory: DEMO_DIRECTORY,
          sessionId: MAIN_SESSION,
        }),
      );

      await waitFor(() => {
        expect(result.current.currentQuestion).toBeDefined();
      });
      expect(result.current.currentQuestion?.id).toBe("que_main");
    });

    test("currentPermission is the first matching session permission", async () => {
      const { result } = renderHookWithProviders(() =>
        useSessionData({
          directory: DEMO_DIRECTORY,
          sessionId: MAIN_SESSION,
        }),
      );

      await waitFor(() => {
        expect(result.current.currentPermission).toBeDefined();
      });
      expect(result.current.currentPermission?.id).toBe("per_main");
    });
  });

  describe("when sessionId is null", () => {
    test("returns empty sessionQuestions", async () => {
      const { result } = renderHookWithProviders(() =>
        useSessionData({
          directory: DEMO_DIRECTORY,
          sessionId: null,
        }),
      );

      await waitFor(() => {
        expect(result.current.questions).toHaveLength(3);
      });
      expect(result.current.sessionQuestions).toEqual([]);
    });

    test("currentQuestion is undefined", async () => {
      const { result } = renderHookWithProviders(() =>
        useSessionData({
          directory: DEMO_DIRECTORY,
          sessionId: null,
        }),
      );

      await waitFor(() => {
        expect(result.current.questions).toHaveLength(3);
      });
      expect(result.current.currentQuestion).toBeUndefined();
    });

    test("returns empty sessionPermissions", async () => {
      const { result } = renderHookWithProviders(() =>
        useSessionData({
          directory: DEMO_DIRECTORY,
          sessionId: null,
        }),
      );

      await waitFor(() => {
        expect(result.current.permissions).toHaveLength(3);
      });
      expect(result.current.sessionPermissions).toEqual([]);
    });

    test("currentPermission is undefined", async () => {
      const { result } = renderHookWithProviders(() =>
        useSessionData({
          directory: DEMO_DIRECTORY,
          sessionId: null,
        }),
      );

      await waitFor(() => {
        expect(result.current.permissions).toHaveLength(3);
      });
      expect(result.current.currentPermission).toBeUndefined();
    });
  });

  describe("no matching data", () => {
    test("currentQuestion is undefined when no questions match", async () => {
      setupDefaultHandlers({
        questions: [
          createMockQuestion({
            id: "que_other",
            sessionID: UNRELATED_SESSION,
          }),
        ],
      });

      const { result } = renderHookWithProviders(() =>
        useSessionData({
          directory: DEMO_DIRECTORY,
          sessionId: MAIN_SESSION,
        }),
      );

      await waitFor(() => {
        expect(result.current.questions).toHaveLength(1);
      });
      expect(result.current.sessionQuestions).toEqual([]);
      expect(result.current.currentQuestion).toBeUndefined();
    });

    test("currentPermission is undefined when no permissions match", async () => {
      setupDefaultHandlers({
        permissions: [
          createMockPermission({
            id: "per_other",
            sessionID: UNRELATED_SESSION,
          }),
        ],
      });

      const { result } = renderHookWithProviders(() =>
        useSessionData({
          directory: DEMO_DIRECTORY,
          sessionId: MAIN_SESSION,
        }),
      );

      await waitFor(() => {
        expect(result.current.permissions).toHaveLength(1);
      });
      expect(result.current.sessionPermissions).toEqual([]);
      expect(result.current.currentPermission).toBeUndefined();
    });
  });
});
