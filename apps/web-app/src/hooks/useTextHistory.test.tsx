/**
 * @vitest-environment jsdom
 */

import { describe, test, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTextHistory } from "./useTextHistory";

describe("useTextHistory", () => {
  beforeEach(() => {});

  describe("initial state", () => {
    test("starts with empty histories", () => {
      const { result } = renderHook(() => useTextHistory());
      expect(result.current.histories.current).toEqual([]);
    });

    test("starts with cursor index at -1", () => {
      const { result } = renderHook(() => useTextHistory());
      expect(result.current.cursorIndex.current).toBe(-1);
    });
  });

  describe("push", () => {
    test("adds text to histories", () => {
      const { result } = renderHook(() => useTextHistory());
      act(() => result.current.push("hello"));
      expect(result.current.histories.current).toEqual(["hello"]);
    });

    test("resets cursor index after push", () => {
      const { result } = renderHook(() => useTextHistory());
      act(() => {
        result.current.push("first");
        result.current.scrollUp();
      });
      act(() => result.current.push("second"));
      expect(result.current.cursorIndex.current).toBe(-1);
    });

    test("accumulates multiple pushes", () => {
      const { result } = renderHook(() => useTextHistory());
      act(() => {
        result.current.push("first");
        result.current.push("second");
        result.current.push("third");
      });
      expect(result.current.histories.current).toEqual(["first", "second", "third"]);
    });
  });

  describe("clear", () => {
    test("clears all histories", () => {
      const { result } = renderHook(() => useTextHistory());
      act(() => {
        result.current.push("hello");
        result.current.push("world");
      });
      act(() => result.current.clear());
      expect(result.current.histories.current).toEqual([]);
    });

    test("resets cursor index after clear", () => {
      const { result } = renderHook(() => useTextHistory());
      act(() => {
        result.current.push("hello");
        result.current.scrollUp();
      });
      act(() => result.current.clear());
      expect(result.current.cursorIndex.current).toBe(-1);
    });
  });

  describe("scrollUp", () => {
    test("does nothing when histories is empty", () => {
      const { result } = renderHook(() => useTextHistory());
      act(() => result.current.scrollUp());
      expect(result.current.cursorIndex.current).toBe(-1);
    });

    test("moves cursor to last item when cursor is at -1", () => {
      const { result } = renderHook(() => useTextHistory());
      act(() => {
        result.current.push("first");
        result.current.push("second");
        result.current.push("third");
      });
      act(() => result.current.scrollUp());
      expect(result.current.cursorIndex.current).toBe(2);
    });

    test("moves cursor up when not at first item", () => {
      const { result } = renderHook(() => useTextHistory());
      act(() => {
        result.current.push("first");
        result.current.push("second");
        result.current.push("third");
      });
      act(() => result.current.scrollUp());
      act(() => result.current.scrollUp());
      expect(result.current.cursorIndex.current).toBe(1);
    });

    test("stays at first item when cursor is at index 0", () => {
      const { result } = renderHook(() => useTextHistory());
      act(() => {
        result.current.push("first");
        result.current.push("second");
      });
      act(() => {
        result.current.scrollUp();
        result.current.scrollUp();
        result.current.scrollUp();
      });
      expect(result.current.cursorIndex.current).toBe(0);
    });

    test("resets cursor when histories becomes empty after scrollUp", () => {
      const { result } = renderHook(() => useTextHistory());
      act(() => result.current.push("hello"));
      act(() => result.current.scrollUp());
      act(() => result.current.clear());
      act(() => result.current.scrollUp());
      expect(result.current.cursorIndex.current).toBe(-1);
    });
  });

  describe("scrollDown", () => {
    test("does nothing when histories is empty", () => {
      const { result } = renderHook(() => useTextHistory());
      act(() => result.current.scrollDown());
      expect(result.current.cursorIndex.current).toBe(-1);
    });

    test("resets cursor when cursor is at -1", () => {
      const { result } = renderHook(() => useTextHistory());
      act(() => {
        result.current.push("first");
        result.current.push("second");
      });
      act(() => result.current.scrollDown());
      expect(result.current.cursorIndex.current).toBe(-1);
    });

    test("moves cursor down when not at last item", () => {
      const { result } = renderHook(() => useTextHistory());
      act(() => {
        result.current.push("first");
        result.current.push("second");
        result.current.push("third");
      });
      act(() => result.current.scrollUp());
      act(() => result.current.scrollUp());
      act(() => result.current.scrollDown());
      expect(result.current.cursorIndex.current).toBe(2);
    });

    test("stays at last item when cursor is at last index", () => {
      const { result } = renderHook(() => useTextHistory());
      act(() => {
        result.current.push("first");
        result.current.push("second");
      });
      act(() => {
        result.current.scrollUp();
        result.current.scrollDown();
        result.current.scrollDown();
      });
      expect(result.current.cursorIndex.current).toBe(1);
    });

    test("stays at last item when scrolling down from last item", () => {
      const { result } = renderHook(() => useTextHistory());
      act(() => {
        result.current.push("first");
        result.current.push("second");
      });
      act(() => result.current.scrollUp());
      act(() => result.current.scrollDown());
      expect(result.current.cursorIndex.current).toBe(1);
    });
  });

  describe("round-trip navigation", () => {
    test("navigates up then down stays at last index", () => {
      const { result } = renderHook(() => useTextHistory());
      act(() => {
        result.current.push("a");
        result.current.push("b");
        result.current.push("c");
      });
      act(() => result.current.scrollUp());
      act(() => result.current.scrollDown());
      expect(result.current.cursorIndex.current).toBe(2);
    });

    test("navigates up multiple times then down", () => {
      const { result } = renderHook(() => useTextHistory());
      act(() => {
        result.current.push("a");
        result.current.push("b");
        result.current.push("c");
      });
      act(() => result.current.scrollUp());
      act(() => result.current.scrollUp());
      act(() => result.current.scrollDown());
      expect(result.current.cursorIndex.current).toBe(2);
    });
  });
});