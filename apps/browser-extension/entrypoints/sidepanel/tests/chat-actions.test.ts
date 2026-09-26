import { describe, expect, it, vi } from "vitest";
import { submitChatMessage } from "../lib/opencode/chat-actions";
import {
  buildContextAttachmentText,
  buildSelectionContextText,
  createPageAttachment,
} from "../lib/opencode/context";

const pageContext = createPageAttachment({
  title: "Cloudy",
  content: "Page content",
  url: "https://example.com",
});
function baseOverrides(overrides: Record<string, unknown> = {}) {
  return {
    input: "  Summarize this  ",
    pageContext: null,
    selectionText: null as string | null,
    isGenerating: false,
    sessionId: "session-1",
    createSession: vi.fn(),
    isInContext: vi.fn().mockResolvedValue(false),
    prompt: vi.fn().mockResolvedValue(undefined),
    setInput: vi.fn(),
    setPageContext: vi.fn(),
    dismissSelection: vi.fn(),
    setIsGenerating: vi.fn(),
    setError: vi.fn(),
    ...overrides,
  };
}

describe("submitChatMessage", () => {
  it("sends page context and the current selection with the prompt", async () => {
    const isInContext = vi.fn().mockResolvedValue(false);
    const prompt = vi.fn().mockResolvedValue(undefined);
    const setInput = vi.fn();
    const setPageContext = vi.fn();
    const dismissSelection = vi.fn();
    const setIsGenerating = vi.fn();
    const setError = vi.fn();

    await submitChatMessage(
      baseOverrides({
        pageContext,
        selectionText: "Selected content",
        isInContext,
        prompt,
        setInput,
        setPageContext,
        dismissSelection,
        setIsGenerating,
        setError,
      }),
    );

    expect(setError).toHaveBeenCalledWith(null);
    expect(setInput).toHaveBeenCalledWith("");
    expect(setPageContext).toHaveBeenCalledWith(null);
    expect(dismissSelection).toHaveBeenCalledOnce();
    expect(setIsGenerating).toHaveBeenCalledWith(true);
    expect(isInContext).toHaveBeenNthCalledWith(
      1,
      buildContextAttachmentText(pageContext),
    );
    expect(isInContext).toHaveBeenNthCalledWith(
      2,
      buildSelectionContextText("Selected content"),
    );
    expect(prompt).toHaveBeenCalledWith("session-1", [
      buildContextAttachmentText(pageContext),
      buildSelectionContextText("Selected content"),
      "Summarize this",
    ]);
  });

  it("sends no context when page context was not added", async () => {
    const createSession = vi.fn().mockResolvedValue("session-2");
    const isInContext = vi.fn();
    const prompt = vi.fn().mockResolvedValue(undefined);

    await submitChatMessage(
      baseOverrides({
        sessionId: null,
        createSession,
        isInContext,
        prompt,
      }),
    );

    expect(createSession).toHaveBeenCalledOnce();
    expect(isInContext).not.toHaveBeenCalled();
    expect(prompt).toHaveBeenCalledWith("session-2", ["Summarize this"]);
  });

  it("skips page context already present in the session", async () => {
    const isInContext = vi.fn().mockResolvedValue(true);
    const prompt = vi.fn().mockResolvedValue(undefined);

    await submitChatMessage(
      baseOverrides({
        pageContext,
        isInContext,
        prompt,
      }),
    );

    expect(prompt).toHaveBeenCalledWith("session-1", ["Summarize this"]);
  });

  it("does not perform work for blank input or an active generation", async () => {
    const createSession = vi.fn();
    const setError = vi.fn();

    await submitChatMessage(
      baseOverrides({
        input: "   ",
        createSession,
        setError,
      }),
    );

    expect(createSession).not.toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();
  });

  it("surfaces prompt failures and stops the generation state", async () => {
    const setError = vi.fn();
    const setIsGenerating = vi.fn();

    await submitChatMessage(
      baseOverrides({
        prompt: vi.fn().mockRejectedValue(new Error("Prompt failed")),
        setIsGenerating,
        setError,
      }),
    );

    expect(setIsGenerating).toHaveBeenNthCalledWith(1, true);
    expect(setIsGenerating).toHaveBeenNthCalledWith(2, false);
    expect(setError).toHaveBeenLastCalledWith("Prompt failed");
  });
});
