import type { SessionModel } from "./sessions";
import type { PageContent } from "./context";
import { buildPageContext, buildSelectedTextContext } from "./context";

interface SubmitChatMessageOptions {
  input: string;
  selectedText: string;
  isGenerating: boolean;
  sessionId: string | null;
  createSession: () => Promise<string>;
  getCurrentPageContent: () => Promise<PageContent | undefined>;
  isInContext: (context: string) => Promise<boolean>;
  injectContext: (sessionId: string, context: string) => Promise<void>;
  sendPrompt: (sessionId: string, text: string) => Promise<void>;
  setInput: (input: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
}

export async function submitChatMessage({
  input,
  selectedText,
  isGenerating,
  sessionId,
  createSession,
  getCurrentPageContent,
  isInContext,
  injectContext,
  sendPrompt,
  setInput,
  setIsGenerating,
  setError,
}: SubmitChatMessageOptions) {
  const text = input.trim();
  if (!text || isGenerating) return;

  setError(null);
  setInput("");

  try {
    const currentSessionId = sessionId ?? (await createSession());
    setIsGenerating(true);

    const pageContent = await getCurrentPageContent();
    const contexts = [
      pageContent ? buildPageContext(pageContent) : null,
      selectedText ? buildSelectedTextContext(selectedText) : null,
    ];

    for (const context of contexts) {
      if (!context || (await isInContext(context))) continue;
      await injectContext(currentSessionId, context);
    }

    await sendPrompt(currentSessionId, text);
  } catch (error: unknown) {
    setIsGenerating(false);
    setError(error instanceof Error ? error.message : "Failed to send message");
  }
}
