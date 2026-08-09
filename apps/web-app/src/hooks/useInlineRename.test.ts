// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useInlineRename } from "./useInlineRename";

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
}));

vi.mock("@/hooks/queries/useSessions", () => ({
  useUpdateSession: () => ({ mutate: mocks.mutate, isPending: false }),
}));

describe("useInlineRename", () => {
  beforeEach(() => {
    mocks.mutate.mockReset();
  });

  test("start() seeds value from initialTitle and enters editing", () => {
    const { result } = renderHook(() =>
      useInlineRename({
        sessionId: "ses_1",
        directory: "/demo",
        initialTitle: "Hello",
      }),
    );

    expect(result.current.isEditing).toBe(false);

    act(() => result.current.start());

    expect(result.current.isEditing).toBe(true);
    expect(result.current.value).toBe("Hello");
  });

  test("commit() no-ops on empty/whitespace value and does not mutate", () => {
    const { result } = renderHook(() =>
      useInlineRename({
        sessionId: "ses_1",
        directory: "/demo",
        initialTitle: "Hello",
      }),
    );

    act(() => result.current.start());
    act(() => result.current.setValue("   "));
    act(() => result.current.commit());

    expect(mocks.mutate).not.toHaveBeenCalled();
    expect(result.current.isEditing).toBe(false);
  });

  test("commit() no-ops when title is unchanged and does not mutate", () => {
    const { result } = renderHook(() =>
      useInlineRename({
        sessionId: "ses_1",
        directory: "/demo",
        initialTitle: "Hello",
      }),
    );

    act(() => result.current.start());
    act(() => result.current.setValue("Hello"));
    act(() => result.current.commit());

    expect(mocks.mutate).not.toHaveBeenCalled();
    expect(result.current.isEditing).toBe(false);
  });

  test("cancel() reverts value and exits editing without mutating", () => {
    const { result } = renderHook(() =>
      useInlineRename({
        sessionId: "ses_1",
        directory: "/demo",
        initialTitle: "Hello",
      }),
    );

    act(() => result.current.start());
    act(() => result.current.setValue("Changed"));
    act(() => result.current.cancel());

    expect(result.current.value).toBe("Hello");
    expect(result.current.isEditing).toBe(false);
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  test("commit() calls mutate with trimmed title and correct args on a real change", () => {
    const { result } = renderHook(() =>
      useInlineRename({
        sessionId: "ses_1",
        directory: "/demo",
        initialTitle: "Hello",
      }),
    );

    act(() => result.current.start());
    act(() => result.current.setValue("  New Title  "));
    act(() => result.current.commit());

    expect(mocks.mutate).toHaveBeenCalledTimes(1);
    expect(mocks.mutate).toHaveBeenCalledWith({
      sessionID: "ses_1",
      directory: "/demo",
      title: "New Title",
    });
    expect(result.current.isEditing).toBe(false);
  });

  test("commit() without directory omits it from the mutate payload", () => {
    const { result } = renderHook(() =>
      useInlineRename({
        sessionId: "ses_1",
        initialTitle: "Hello",
      }),
    );

    act(() => result.current.start());
    act(() => result.current.setValue("World"));
    act(() => result.current.commit());

    expect(mocks.mutate).toHaveBeenCalledWith({
      sessionID: "ses_1",
      directory: undefined,
      title: "World",
    });
  });
});
