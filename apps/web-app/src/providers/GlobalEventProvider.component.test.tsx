import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { GlobalEventProvider, useGlobalEvent } from "./GlobalEventProvider";

const { handleEvent } = vi.hoisted(() => ({ handleEvent: vi.fn() }));
vi.mock("@/lib/opencode", () => ({ handleEvent }));

function renderProvider() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <GlobalEventProvider>{children}</GlobalEventProvider>
    </QueryClientProvider>
  );
  return renderHook(() => useGlobalEvent(), { wrapper });
}

afterEach(() => {
  vi.unstubAllGlobals();
  handleEvent.mockReset();
});

describe("GlobalEventProvider", () => {
  test("connects to the Cloudy provider stream and parses normalized events", async () => {
    const event = JSON.stringify({ type: "session.status", sessionId: "s1" });
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'event: connected\ndata: {"type":"connected"}\n\n',
          ),
        );
        controller.enqueue(
          new TextEncoder().encode(`event: session.status\ndata: ${event}\n\n`),
        );
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(stream))),
    );

    const { result } = renderProvider();

    await waitFor(() => expect(result.current.status).toBe("CONNETED"));
    expect(handleEvent).toHaveBeenCalledWith(
      JSON.parse(event),
      expect.anything(),
    );
  });

  test("becomes connected before the first provider event", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'event: connected\ndata: {"type":"connected"}\n\n',
          ),
        );
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(stream))),
    );

    const { result } = renderProvider();

    await waitFor(() => expect(result.current.status).toBe("CONNETED"));
    expect(handleEvent).not.toHaveBeenCalled();
  });

  test("manual reconnect starts another request", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response(new ReadableStream())),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderProvider();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    result.current.reconnect();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
