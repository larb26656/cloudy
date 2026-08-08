import { describe, test, expect, beforeEach } from "vitest";
import { useQuickPhrasesStore, MAX_PHRASES } from "./quickPhrasesStore";

describe("quickPhrasesStore", () => {
  beforeEach(() => {
    useQuickPhrasesStore.setState({ phrases: [] });
  });

  test("addPhrase adds a trimmed phrase", () => {
    useQuickPhrasesStore.getState().addPhrase("  hello world  ");
    expect(useQuickPhrasesStore.getState().phrases).toEqual(["hello world"]);
  });

  test("addPhrase ignores empty/whitespace", () => {
    useQuickPhrasesStore.getState().addPhrase("   ");
    useQuickPhrasesStore.getState().addPhrase("");
    expect(useQuickPhrasesStore.getState().phrases).toEqual([]);
  });

  test("addPhrase enforces max limit", () => {
    for (let i = 0; i < MAX_PHRASES; i++) {
      useQuickPhrasesStore.getState().addPhrase(`phrase-${i}`);
    }
    expect(useQuickPhrasesStore.getState().phrases).toHaveLength(MAX_PHRASES);

    useQuickPhrasesStore.getState().addPhrase("overflow");
    expect(useQuickPhrasesStore.getState().phrases).toHaveLength(MAX_PHRASES);
    expect(useQuickPhrasesStore.getState().phrases).not.toContain("overflow");
  });

  test("removePhrase removes by index", () => {
    useQuickPhrasesStore.getState().addPhrase("a");
    useQuickPhrasesStore.getState().addPhrase("b");
    useQuickPhrasesStore.getState().addPhrase("c");

    useQuickPhrasesStore.getState().removePhrase(1);
    expect(useQuickPhrasesStore.getState().phrases).toEqual(["a", "c"]);
  });

  test("updatePhrase updates by index", () => {
    useQuickPhrasesStore.getState().addPhrase("a");
    useQuickPhrasesStore.getState().addPhrase("b");

    useQuickPhrasesStore.getState().updatePhrase(0, "updated");
    expect(useQuickPhrasesStore.getState().phrases).toEqual(["updated", "b"]);
  });

  test("reorderPhrases moves an item from one index to another", () => {
    useQuickPhrasesStore.getState().setPhrases(["a", "b", "c"]);

    useQuickPhrasesStore.getState().reorderPhrases(0, 2);
    expect(useQuickPhrasesStore.getState().phrases).toEqual(["b", "c", "a"]);
  });

  test("reorderPhrases moves an item forward", () => {
    useQuickPhrasesStore.getState().setPhrases(["a", "b", "c"]);

    useQuickPhrasesStore.getState().reorderPhrases(2, 0);
    expect(useQuickPhrasesStore.getState().phrases).toEqual(["c", "a", "b"]);
  });

  test("reorderPhrases is a no-op when from === to", () => {
    useQuickPhrasesStore.getState().setPhrases(["a", "b", "c"]);

    useQuickPhrasesStore.getState().reorderPhrases(1, 1);
    expect(useQuickPhrasesStore.getState().phrases).toEqual(["a", "b", "c"]);
  });

  test("reorderPhrases ignores out-of-bounds indices", () => {
    useQuickPhrasesStore.getState().setPhrases(["a", "b", "c"]);

    useQuickPhrasesStore.getState().reorderPhrases(-1, 1);
    useQuickPhrasesStore.getState().reorderPhrases(0, 5);
    expect(useQuickPhrasesStore.getState().phrases).toEqual(["a", "b", "c"]);
  });

  test("setPhrases truncates to max", () => {
    const many = Array.from({ length: MAX_PHRASES + 5 }, (_, i) => `p${i}`);
    useQuickPhrasesStore.getState().setPhrases(many);
    expect(useQuickPhrasesStore.getState().phrases).toHaveLength(MAX_PHRASES);
  });
});
