import { beforeEach, describe, expect, test } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { PermissionRequest, QuestionRequest } from "@/types";
import { server } from "@/test/server";
import { useSessionData } from "./useSessionHumanApprove";

const DIRECTORY = "/demo/project";
const SESSION_ID = "c9c91a3d-8618-4bf4-a0ca-6a78535afbc6";

const question: QuestionRequest = {
  id: "que_main",
  sessionID: SESSION_ID,
  questions: [],
};

const permission: PermissionRequest = {
  id: "per_main",
  sessionID: SESSION_ID,
  permission: "read",
  patterns: [],
  metadata: {},
  always: [],
};

function renderSessionData(sessionId: string | null = SESSION_ID) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useSessionData({ directory: DIRECTORY, sessionId }), {
    wrapper,
  });
}

beforeEach(() => {
  server.use(
    http.get(new RegExp(`/api/sessions/${SESSION_ID}/questions$`), () =>
      HttpResponse.json([{ ...question, sessionId: SESSION_ID }]),
    ),
    http.get(/\/api\/providers\/opencode\/permissions(\?|$)/, () =>
      HttpResponse.json([{ ...permission, sessionId: SESSION_ID }]),
    ),
    http.get(new RegExp(`/api/sessions/${SESSION_ID}/children$`), () =>
      HttpResponse.json([]),
    ),
  );
});

describe("useSessionData", () => {
  test("uses the Cloudy session endpoint for pending questions", async () => {
    const { result } = renderSessionData();

    await waitFor(() => {
      expect(result.current.questions).toEqual([question]);
    });
    expect(result.current.currentQuestion).toEqual(question);
  });

  test("keeps permission filtering scoped to the active Cloudy session", async () => {
    const { result } = renderSessionData();

    await waitFor(() => {
      expect(result.current.sessionPermissions).toEqual([
        expect.objectContaining({
          id: permission.id,
          sessionID: permission.sessionID,
        }),
      ]);
    });
  });

  test("does not fetch questions without a Cloudy session", async () => {
    const { result } = renderSessionData(null);

    await waitFor(() => {
      expect(result.current.currentQuestion).toBeUndefined();
    });
    expect(result.current.questions).toEqual([]);
  });
});
