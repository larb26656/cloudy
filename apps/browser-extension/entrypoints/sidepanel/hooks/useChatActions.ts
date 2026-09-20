import { useQueryClient } from "@tanstack/react-query";
import type { SessionModel } from "../lib/opencode/sessions";
import {
  abortSession,
  createBotSession,
  promptSession,
} from "../lib/opencode/sessions";
import { submitChatMessage } from "../lib/opencode/chat-actions";
import type { PageContent } from "../lib/opencode/context";
import { sessionKeys } from "../queries/query-keys";
import { useSessionStore } from "../stores/sessionStore";

interface UseChatActionsOptions {
  directory: string;
  input: string;
  model: SessionModel | null;
  selectedText: string;
  isGenerating: boolean;
  isInContext: (context: string) => Promise<boolean>;
  setInput: (input: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  selectSession: (sessionId: string) => Promise<void>;
  clearSession: () => Promise<void>;
}

async function getCurrentPageContent(): Promise<PageContent | undefined> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  try {
    return await browser.tabs.sendMessage(tab.id, { type: "GET_PAGE_CONTENT" });
  } catch {
    throw new Error("Cannot get page content");
  }
}

export function useChatActions({
  directory,
  input,
  model,
  selectedText,
  isGenerating,
  isInContext,
  setInput,
  setIsGenerating,
  setError,
  selectSession,
  clearSession,
}: UseChatActionsOptions) {
  const queryClient = useQueryClient();

  const submit = async () => {
    await submitChatMessage({
      input,
      selectedText,
      isGenerating,
      sessionId: useSessionStore.getState().sessionId,
      createSession: async () => {
        const session = await createBotSession(directory, model);
        await selectSession(session.id);
        void queryClient.invalidateQueries({ queryKey: sessionKeys.root() });
        return session.id;
      },
      getCurrentPageContent,
      isInContext,
      prompt: (sessionId, texts) =>
        promptSession(sessionId, texts, directory, model),
      setInput,
      setIsGenerating,
      setError,
    });
  };

  const stop = async () => {
    const sessionId = useSessionStore.getState().sessionId;
    if (!sessionId) return;

    try {
      await abortSession(sessionId, directory);
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Failed to stop generation",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const changeSession = (sessionId: string) => {
    setIsGenerating(false);
    setError(null);
    void selectSession(sessionId).catch((error: unknown) => {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save session selection",
      );
    });
  };

  const newChat = () => {
    setIsGenerating(false);
    setError(null);
    void clearSession().catch((error: unknown) => {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to clear session selection",
      );
    });
  };

  return { submit, stop, changeSession, newChat };
}
