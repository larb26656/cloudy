import { describe, test, expect, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useWindowFocus } from "./useWindowFocus";

function setHidden(value: boolean) {
  Object.defineProperty(document, "hidden", {
    value,
    configurable: true,
    writable: true,
  });
}

function setHasFocus(value: boolean) {
  vi.spyOn(document, "hasFocus").mockReturnValue(value);
}

function dispatchVisibility() {
  document.dispatchEvent(new Event("visibilitychange"));
}

function dispatchFocus() {
  window.dispatchEvent(new Event("focus"));
}

function dispatchBlur() {
  window.dispatchEvent(new Event("blur"));
}

function renderFocusHook() {
  return renderHook(() => useWindowFocus());
}

describe("useWindowFocus", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setHidden(false);
    setHasFocus(true);
  });

  test("returns true by default when focused and visible", () => {
    setHidden(false);
    setHasFocus(true);
    const { result } = renderFocusHook();
    expect(result.current).toBe(true);
  });

  test("returns false when document becomes hidden", () => {
    setHidden(false);
    setHasFocus(true);
    const { result } = renderFocusHook();

    act(() => {
      setHidden(true);
      dispatchVisibility();
    });
    expect(result.current).toBe(false);
  });

  test("returns true again when document becomes visible", () => {
    setHidden(true);
    setHasFocus(true);
    const { result } = renderFocusHook();
    expect(result.current).toBe(false);

    act(() => {
      setHidden(false);
      dispatchVisibility();
    });
    expect(result.current).toBe(true);
  });

  test("returns false on window blur", () => {
    setHidden(false);
    setHasFocus(true);
    const { result } = renderFocusHook();

    act(() => {
      setHasFocus(false);
      dispatchBlur();
    });
    expect(result.current).toBe(false);
  });

  test("returns true on window focus after blur", () => {
    setHidden(false);
    const { result } = renderFocusHook();

    act(() => {
      setHasFocus(false);
      dispatchBlur();
    });
    expect(result.current).toBe(false);

    act(() => {
      setHasFocus(true);
      dispatchFocus();
    });
    expect(result.current).toBe(true);
  });

  test("requires both hasFocus and visible to be true", () => {
    setHidden(false);
    setHasFocus(true);
    const { result } = renderFocusHook();
    expect(result.current).toBe(true);

    act(() => {
      setHasFocus(false);
      dispatchBlur();
    });
    expect(result.current).toBe(false);

    act(() => {
      setHasFocus(true);
      setHidden(true);
      dispatchVisibility();
    });
    expect(result.current).toBe(false);
  });

  test("stops reacting to events after unmount", () => {
    setHidden(false);
    setHasFocus(true);
    const { result, unmount } = renderFocusHook();
    expect(result.current).toBe(true);

    unmount();

    act(() => {
      setHidden(true);
      dispatchVisibility();
      dispatchBlur();
    });
    expect(result.current).toBe(true);
  });
});
