import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { GlobalEvent } from "@opencode-ai/sdk/v2";
import { GlobalEventProvider, useGlobalEvent } from "./GlobalEventProvider";

// --- Mocks ---

const { mockEvent, mockHandleEvent } = vi.hoisted(() => ({
  mockEvent: vi.fn(),
  mockHandleEvent: vi.fn(),
}));

vi.mock("@/lib/opencode", () => ({
  getOcClient: () => ({ global: { event: mockEvent } }),
  handleEvent: mockHandleEvent,
}));

type NextResult =
  | { done: false; value: GlobalEvent }
  | { done: true; value: undefined };

/**
 * Minimal controllable async iterator that mimics the SDK's SSE stream.
 * - `emit(event)` yields an event to the running `for await` loop.
 * - `end()` makes the next `.next()` return `{ done: true }`.
 * - `return()` (called by the provider's cleanup) ends the stream idempotently.
 */
class MockStream {
  private buffer: NextResult[] = [];
  private waiters: Array<(v: NextResult) => void> = [];
  private ended = false;

  emit(event: GlobalEvent) {
    const result: NextResult = { done: false, value: event };
    const w = this.waiters.shift();
    if (w) w(result);
    else this.buffer.push(result);
  }

  end() {
    if (this.ended) return;
    this.ended = true;
    const result: NextResult = { done: true, value: undefined };
    while (this.waiters.length) this.waiters.shift()!(result);
    this.buffer.push(result);
  }

  next(): Promise<NextResult> {
    if (this.buffer.length) return Promise.resolve(this.buffer.shift()!);
    return new Promise<NextResult>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  return(): Promise<NextResult> {
    this.end();
    return Promise.resolve({ done: true, value: undefined });
  }

  throw(e?: unknown): Promise<NextResult> {
    return Promise.reject(e);
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}

const streams: MockStream[] = [];

// --- Helpers ---

let hasFocusSpy: ReturnType<typeof vi.spyOn>;

function setHidden(value: boolean) {
  Object.defineProperty(document, "hidden", {
    value,
    configurable: true,
    writable: true,
  });
}

function setHasFocus(value: boolean) {
  hasFocusSpy.mockReturnValue(value);
}

function loseFocus() {
  setHasFocus(false);
  act(() => {
    window.dispatchEvent(new Event("blur"));
  });
}

function regainFocus() {
  setHasFocus(true);
  act(() => {
    window.dispatchEvent(new Event("focus"));
  });
}

function makeEvent(overrides?: Partial<GlobalEvent>): GlobalEvent {
  return { type: "Session", ...overrides } as unknown as GlobalEvent;
}

function renderProvider() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <GlobalEventProvider>{children}</GlobalEventProvider>
    </QueryClientProvider>
  );
  return renderHook(() => useGlobalEvent(), { wrapper });
}

function latestStream(): MockStream {
  return streams[streams.length - 1]!;
}

async function connectFirst(result: { current: { status: string } }) {
  await waitFor(() => expect(streams.length).toBe(1));
  await act(async () => {
    latestStream().emit(makeEvent());
  });
  expect(result.current.status).toBe("CONNETED");
}

async function disconnect(result: { current: { status: string } }) {
  await act(async () => {
    latestStream().end();
  });
  expect(result.current.status).toBe("DISCONNECTED");
}

// --- Setup ---

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  streams.length = 0;
  mockEvent.mockReset();
  mockEvent.mockImplementation(() => {
    const s = new MockStream();
    streams.push(s);
    return Promise.resolve({ stream: s });
  });
  mockHandleEvent.mockReset();
  hasFocusSpy = vi.spyOn(document, "hasFocus").mockReturnValue(true);
  setHidden(false);
});

afterEach(() => {
  vi.restoreAllMocks();
  setHidden(false);
});

// --- Tests ---

describe("GlobalEventProvider", () => {
  test("status flows PENDING → CONNETED on first event", async () => {
    const { result } = renderProvider();
    expect(result.current.status).toBe("PENDING");

    await connectFirst(result);
  });

  test("status → DISCONNECTED when the stream ends", async () => {
    const { result } = renderProvider();
    await connectFirst(result);
    await disconnect(result);
  });

  test("does NOT reconnect while status is CONNETED on focus regain", async () => {
    const { result } = renderProvider();
    await connectFirst(result);

    loseFocus();
    regainFocus();

    expect(mockEvent).toHaveBeenCalledTimes(1);
  });

  test("does NOT reconnect when only losing focus", async () => {
    const { result } = renderProvider();
    await connectFirst(result);
    await disconnect(result);

    loseFocus();
    expect(mockEvent).toHaveBeenCalledTimes(1);
  });

  test("auto-reconnects when window regains focus after disconnect", async () => {
    const { result } = renderProvider();
    await connectFirst(result);
    await disconnect(result);

    loseFocus();
    expect(mockEvent).toHaveBeenCalledTimes(1);

    regainFocus();

    await waitFor(() => expect(mockEvent).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(streams.length).toBe(2));
    expect(result.current.status).toBe("PENDING");
  });

  test("does NOT reconnect if focus was never lost", async () => {
    const { result } = renderProvider();
    await connectFirst(result);
    await disconnect(result);

    // Focus stays true the whole time; no transition → no auto-reconnect.
    expect(mockEvent).toHaveBeenCalledTimes(1);
  });

  test("manual reconnect() opens a new stream", async () => {
    const { result } = renderProvider();
    await connectFirst(result);
    await disconnect(result);

    act(() => result.current.reconnect());

    await waitFor(() => expect(mockEvent).toHaveBeenCalledTimes(2));
    expect(result.current.status).toBe("PENDING");
  });
});
