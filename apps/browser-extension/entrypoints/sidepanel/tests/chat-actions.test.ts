import { describe, expect, it, vi } from "vitest";
import { submitChatMessage } from "../lib/opencode/chat-actions";
import {
  buildPageContext,
  buildSelectedTextContext,
} from "../lib/opencode/context";

describe("submitChatMessage", () => {
  it("creates a session, injects missing contexts, then sends the prompt", async () => {
    const createSession = vi.fn().mockResolvedValue("session-1");
    const getCurrentPageContent = vi.fn().mockResolvedValue({
      title: "Cloudy",
      content: "Page content",
      url: "https://example.com",
    });
    const pageContext = buildPageContext(await getCurrentPageContent());
    const selectedTextContext = buildSelectedTextContext("Selected content");
    const isInContext = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const injectContext = vi.fn().mockResolvedValue(undefined);
    const sendPrompt = vi.fn().mockResolvedValue(undefined);
    const setInput = vi.fn();
    const setIsGenerating = vi.fn();
    const setError = vi.fn();

    await submitChatMessage({
      input: "  Summarize this  ",
      selectedText: "Selected content",
      isGenerating: false,
      sessionId: null,
      createSession,
      getCurrentPageContent,
      isInContext,
      injectContext,
      sendPrompt,
      setInput,
      setIsGenerating,
      setError,
    });

    expect(createSession).toHaveBeenCalledOnce();
    expect(setError).toHaveBeenCalledWith(null);
    expect(setInput).toHaveBeenCalledWith("");
    expect(setIsGenerating).toHaveBeenCalledWith(true);
    expect(isInContext).toHaveBeenNthCalledWith(1, pageContext);
    expect(isInContext).toHaveBeenNthCalledWith(2, selectedTextContext);
    expect(injectContext).toHaveBeenCalledOnce();
    expect(injectContext).toHaveBeenCalledWith("session-1", pageContext);
    expect(sendPrompt).toHaveBeenCalledWith("session-1", "Summarize this");
  });

  it("does not perform work for blank input or an active generation", async () => {
    const createSession = vi.fn();
    const setError = vi.fn();

    await submitChatMessage({
      input: "   ",
      selectedText: "",
      isGenerating: false,
      sessionId: "session-1",
      createSession,
      getCurrentPageContent: vi.fn(),
      isInContext: vi.fn(),
      injectContext: vi.fn(),
      sendPrompt: vi.fn(),
      setInput: vi.fn(),
      setIsGenerating: vi.fn(),
      setError,
    });

    expect(createSession).not.toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();
  });

  it("surfaces prompt failures and stops the generation state", async () => {
    const setError = vi.fn();
    const setIsGenerating = vi.fn();

    await submitChatMessage({
      input: "Hello",
      selectedText: "",
      isGenerating: false,
      sessionId: "session-1",
      createSession: vi.fn(),
      getCurrentPageContent: vi.fn().mockResolvedValue(undefined),
      isInContext: vi.fn(),
      injectContext: vi.fn(),
      sendPrompt: vi.fn().mockRejectedValue(new Error("Prompt failed")),
      setInput: vi.fn(),
      setIsGenerating,
      setError,
    });

    expect(setIsGenerating).toHaveBeenNthCalledWith(1, true);
    expect(setIsGenerating).toHaveBeenNthCalledWith(2, false);
    expect(setError).toHaveBeenLastCalledWith("Prompt failed");
  });
});
