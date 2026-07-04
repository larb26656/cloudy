import { describe, test, expect, beforeEach } from "vitest";
import { useTextHistoryStore } from "./textHistoryStore";

const getStore = () => {
    const state = useTextHistoryStore.getState();
    return state;
};

const clearStore = () => {
    useTextHistoryStore.getState().clear();
};

describe("useTextHistoryStore", () => {
    beforeEach(() => {
        clearStore();
    });

    describe("initial state", () => {
        test("starts with empty histories", () => {
            expect(getStore().histories).toEqual([]);
        });

        test("starts with cursor index at -1", () => {
            expect(getStore().cursorIndex).toBe(-1);
        });
    });

    describe("push", () => {
        test("adds text to histories", () => {
            const store = getStore();
            store.push("hello");
            expect(getStore().histories).toEqual(["hello"]);
        });

        test("resets cursor index after push", () => {
            const store = getStore();
            store.push("first");
            store.scrollUp();
            store.push("second");
            expect(getStore().cursorIndex).toBe(-1);
        });

        test("accumulates multiple pushes", () => {
            const store = getStore();
            store.push("first");
            store.push("second");
            store.push("third");
            expect(getStore().histories).toEqual(["first", "second", "third"]);
        });

        test("trims whitespace before adding", () => {
            const store = getStore();
            store.push("  hello  ");
            expect(getStore().histories).toEqual(["hello"]);
        });

        test("ignores empty text", () => {
            const store = getStore();
            store.push("");
            store.push("   ");
            expect(getStore().histories).toEqual([]);
        });
    });

    describe("clear", () => {
        test("clears all histories", () => {
            const store = getStore();
            store.push("hello");
            store.push("world");
            store.clear();
            expect(getStore().histories).toEqual([]);
        });

        test("resets cursor index after clear", () => {
            const store = getStore();
            store.push("hello");
            store.scrollUp();
            store.clear();
            expect(getStore().cursorIndex).toBe(-1);
        });
    });

    describe("scrollUp", () => {
        test("does nothing when histories is empty", () => {
            const store = getStore();
            store.scrollUp();
            expect(getStore().cursorIndex).toBe(-1);
        });

        test("moves cursor to last item when cursor is at -1", () => {
            const store = getStore();
            store.push("first");
            store.push("second");
            store.push("third");
            store.scrollUp();
            expect(getStore().cursorIndex).toBe(2);
        });

        test("moves cursor up when not at first item", () => {
            const store = getStore();
            store.push("first");
            store.push("second");
            store.push("third");
            store.scrollUp();
            store.scrollUp();
            expect(getStore().cursorIndex).toBe(1);
        });

        test("stays at first item when cursor is at index 0", () => {
            const store = getStore();
            store.push("first");
            store.push("second");
            store.scrollUp();
            store.scrollUp();
            store.scrollUp();
            expect(getStore().cursorIndex).toBe(0);
        });

        test("resets cursor when histories becomes empty after clear", () => {
            const store = getStore();
            store.push("hello");
            store.scrollUp();
            store.clear();
            store.scrollUp();
            expect(getStore().cursorIndex).toBe(-1);
        });
    });

    describe("scrollDown", () => {
        test("does nothing when histories is empty", () => {
            const store = getStore();
            store.scrollDown();
            expect(getStore().cursorIndex).toBe(-1);
        });

        test("resets cursor when cursor is at -1", () => {
            const store = getStore();
            store.push("first");
            store.push("second");
            store.scrollDown();
            expect(getStore().cursorIndex).toBe(-1);
        });

        test("moves cursor down when not at last item", () => {
            const store = getStore();
            store.push("first");
            store.push("second");
            store.push("third");
            store.scrollUp();
            store.scrollUp();
            store.scrollDown();
            expect(getStore().cursorIndex).toBe(2);
        });

        test("resets cursor when cursor is at last index", () => {
            const store = getStore();
            store.push("first");
            store.push("second");
            store.scrollUp();
            store.scrollDown();
            store.scrollDown();
            expect(getStore().cursorIndex).toBe(-1);
        });

        test("resets cursor when scrolling down from last item", () => {
            const store = getStore();
            store.push("first");
            store.push("second");
            store.scrollUp();
            store.scrollDown();
            expect(getStore().cursorIndex).toBe(-1);
        });
    });

    describe("round-trip navigation", () => {
        test("navigates up then down returns to -1 from last item", () => {
            const store = getStore();
            store.push("a");
            store.push("b");
            store.push("c");
            store.scrollUp();
            store.scrollDown();
            expect(getStore().cursorIndex).toBe(-1);
        });

        test("navigates up multiple times then down", () => {
            const store = getStore();
            store.push("a");
            store.push("b");
            store.push("c");
            store.scrollUp();
            store.scrollUp();
            store.scrollDown();
            expect(getStore().cursorIndex).toBe(2);
        });
    });

    describe("currentValue", () => {
        test("returns empty string when cursor is -1", () => {
            const store = getStore();
            store.clear();
            const currentValue = store.cursorIndex === -1 ? "" : store.histories[store.cursorIndex] ?? "";
            expect(currentValue).toBe("");
        });

        test("returns history item at cursor index", () => {
            useTextHistoryStore.getState().clear();
            useTextHistoryStore.getState().push("first");
            useTextHistoryStore.getState().push("second");
            useTextHistoryStore.getState().scrollUp();
            const { histories, cursorIndex } = useTextHistoryStore.getState();
            const currentValue = cursorIndex === -1 ? "" : histories[cursorIndex] ?? "";
            expect(currentValue).toBe("second");
        });
    });

    describe("max history limit", () => {
        test("respects MAX_HISTORY limit of 20", () => {
            const store = getStore();
            for (let i = 0; i < 30; i++) {
                store.push(`item-${i}`);
            }
            expect(getStore().histories.length).toBe(20);
            expect(getStore().histories[0]).toBe("item-10");
            expect(getStore().histories[19]).toBe("item-29");
        });
    });

    describe("resetCursor", () => {
        test("resets cursor to -1", () => {
            const store = getStore();
            store.push("hello");
            store.scrollUp();
            store.resetCursor();
            expect(getStore().cursorIndex).toBe(-1);
        });
    });
});