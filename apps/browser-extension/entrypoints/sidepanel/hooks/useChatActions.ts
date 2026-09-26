import { useQueryClient } from "@tanstack/react-query";
import type { SessionModel } from "../lib/opencode/sessions";
import type { ContextAttachment } from "../lib/opencode/context";
import {
  abortSession,
  createBotSession,
  promptSession,
} from "../lib/opencode/sessions";
import { submitChatMessage } from "../lib/opencode/chat-actions";
import { sessionKeys } from "../queries/query-keys";
import { useSessionStore } from "../stores/sessionStore";

interface UseChatActionsOptions {
  directory: string;
  input: string;
  model: SessionModel | null;
  pageContext: ContextAttachment | null;
  selectionText: string | null;
  isGenerating: boolean;
  isInContext: (context: string) => Promise<boolean>;
  setInput: (input: string) => void;
  setPageContext: (pageContext: ContextAttachment | null) => void;
  dismissSelection: () => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  selectSession: (sessionId: string) => Promise<void>;
  clearSession: () => Promise<void>;
}

export function useChatActions({
  directory,
  input,
  model,
  pageContext,
  selectionText,
  isGenerating,
  isInContext,
  setInput,
  setPageContext,
  dismissSelection,
  setIsGenerating,
  setError,
  selectSession,
  clearSession,
}: UseChatActionsOptions) {
  const queryClient = useQueryClient();

  const submit = async () => {
    await submitChatMessage({
      input,
      pageContext,
      selectionText,
      isGenerating,
      sessionId: useSessionStore.getState().sessionId,
      createSession: async () => {
        const session = await createBotSession(directory, model);
        await selectSession(session.id);
        void queryClient.invalidateQueries({ queryKey: sessionKeys.root() });
        return session.id;
      },
      isInContext,
      prompt: (sessionId, texts) =>
        promptSession(sessionId, texts, directory, model),
      setInput,
      setPageContext,
      dismissSelection,
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
