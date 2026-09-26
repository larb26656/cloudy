import type { SessionModel } from "./sessions";
import type { ContextAttachment } from "./context";
import {
  buildContextAttachmentText,
  buildSelectionContextText,
} from "./context";

interface SubmitChatMessageOptions {
  input: string;
  pageContext: ContextAttachment | null;
  selectionText: string | null;
  isGenerating: boolean;
  sessionId: string | null;
  createSession: () => Promise<string>;
  isInContext: (context: string) => Promise<boolean>;
  prompt: (sessionId: string, texts: string[]) => Promise<void>;
  setInput: (input: string) => void;
  setPageContext: (pageContext: ContextAttachment | null) => void;
  dismissSelection: () => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
}

export async function submitChatMessage({
  input,
  pageContext,
  selectionText,
  isGenerating,
  sessionId,
  createSession,
  isInContext,
  prompt,
  setInput,
  setPageContext,
  dismissSelection,
  setIsGenerating,
  setError,
}: SubmitChatMessageOptions) {
  const text = input.trim();
  if (!text || isGenerating) return;

  setError(null);
  setInput("");
  setPageContext(null);
  dismissSelection();

  try {
    const currentSessionId = sessionId ?? (await createSession());
    setIsGenerating(true);

    const newContexts: string[] = [];
    if (pageContext) {
      const context = buildContextAttachmentText(pageContext);
      if (!(await isInContext(context))) newContexts.push(context);
    }
    if (selectionText) {
      const context = buildSelectionContextText(selectionText);
      if (!(await isInContext(context))) newContexts.push(context);
    }

    await prompt(currentSessionId, [...newContexts, text]);
  } catch (error: unknown) {
    setIsGenerating(false);
    setError(error instanceof Error ? error.message : "Failed to send message");
  }
}
