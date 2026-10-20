import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { petTriggerLabel, usePetActivity } from "./usePetActivity";

const mocks = vi.hoisted(() => ({
  permissions: vi.fn(),
  questions: vi.fn(),
  useModels: vi.fn(),
  useRecentSessions: vi.fn(),
  useWorkspaces: vi.fn(),
}));

vi.mock("@/hooks/queries/useSessions", () => ({
  useRecentSessions: mocks.useRecentSessions,
}));

vi.mock("@/hooks/queries", () => ({
  useModels: mocks.useModels,
  useWorkspaces: mocks.useWorkspaces,
}));

vi.mock("@/lib/cloudy/provider", () => ({
  sessionApi: {
    permissions: mocks.permissions,
    questions: mocks.questions,
  },
}));

const sessions = [
  {
    id: "working",
    providerId: "agent",
    directory: "/working",
    status: "active",
    runStatus: "running",
    updatedAt: 100,
  },
  {
    id: "permission",
    providerId: "agent",
    directory: "/permission",
    status: "active",
    runStatus: "running",
    updatedAt: 200,
  },
  {
    id: "question",
    providerId: "agent",
    directory: "/question",
    status: "active",
    runStatus: "running",
    updatedAt: 300,
  },
  {
    id: "unsupported",
    providerId: "basic",
    directory: "/unsupported",
    status: "active",
    runStatus: "running",
    updatedAt: 400,
  },
] as const;

function renderPetActivity() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return renderHook(() => usePetActivity(), { wrapper });
}

describe("usePetActivity", () => {
  beforeEach(() => {
    mocks.permissions.mockReset();
    mocks.questions.mockReset();
    mocks.useModels.mockReturnValue({
      data: [
        {
          id: "agent",
          capabilities: { approvals: true, questions: true },
        },
        {
          id: "basic",
          capabilities: { approvals: false, questions: false },
        },
      ],
    });
    mocks.useRecentSessions.mockReturnValue({
      data: sessions,
      isLoading: false,
    });
    mocks.useWorkspaces.mockReturnValue({ data: [] });
    mocks.questions.mockImplementation(async (sessionId: string) =>
      Response.json(
        sessionId === "question"
          ? [
              {
                id: "question-request",
                sessionId,
                questions: [],
              },
            ]
          : [],
      ),
    );
    mocks.permissions.mockImplementation(async (sessionId: string) =>
      Response.json(
        sessionId === "permission"
          ? [
              {
                id: "permission-request",
                sessionId,
                permission: "read",
                patterns: [],
                always: [],
              },
            ]
          : [],
      ),
    );
  });

  test("prioritizes sessions waiting for questions or permissions over working sessions", async () => {
    const { result } = renderPetActivity();

    await waitFor(() => expect(result.current.waitingCount).toBe(2));

    expect(result.current).toMatchObject({
      petState: "wait-for-human",
      waitingCount: 2,
      workingCount: 1,
      records: [
        {
          session: { id: "question" },
          state: "wait-for-human",
          reason: "question",
        },
        {
          session: { id: "permission" },
          state: "wait-for-human",
          reason: "permission",
        },
        { session: { id: "working" }, state: "working" },
      ],
    });
  });

  test("does not poll sessions whose provider cannot request human input", async () => {
    const { result } = renderPetActivity();

    await waitFor(() => expect(result.current.records).toHaveLength(3));

    expect(mocks.questions).toHaveBeenCalledTimes(3);
    expect(mocks.permissions).toHaveBeenCalledTimes(3);
    expect(mocks.questions).not.toHaveBeenCalledWith("unsupported");
    expect(mocks.permissions).not.toHaveBeenCalledWith("unsupported");
  });
});

describe("petTriggerLabel", () => {
  test("describes waiting activity before working activity", () => {
    expect(petTriggerLabel(1, 2)).toBe(
      "Agent activity: 1 session waiting for you",
    );
  });

  test("uses plural labels and an idle fallback", () => {
    expect(petTriggerLabel(0, 2)).toBe("Agent activity: 2 sessions working");
    expect(petTriggerLabel(0, 0)).toBe("Agent activity");
  });
});
