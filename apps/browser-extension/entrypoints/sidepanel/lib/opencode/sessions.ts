import type { ChatMessage } from "@repo/opencode";
import {
  abortProviderSession,
  createProviderSession,
  listProviderSessions,
  loadProviderMessages,
  sendProviderMessage,
  type ProviderModel,
  type ProviderSession,
} from "../cloudy/provider";

export const INJECTED_CONTEXT_MARKER =
  "<!-- cloudy:browser-extension:injected-context -->";

export type SessionModel = ProviderModel;
export type ChatSession = ProviderSession;

export async function createBotSession(
  directory: string,
  model?: SessionModel | null,
): Promise<ChatSession> {
  return createProviderSession(directory, model);
}

export async function listSessions(directory: string): Promise<ChatSession[]> {
  return listProviderSessions(directory);
}

export async function loadSessionMessages(
  sessionId: string,
  directory: string,
): Promise<ChatMessage[]> {
  return loadProviderMessages(sessionId, directory);
}

export function isInjectedContextMessage(message: ChatMessage): boolean {
  return (
    message.role === "user" &&
    message.parts.some(
      (part) =>
        part.type === "text" && part.text.startsWith(INJECTED_CONTEXT_MARKER),
    )
  );
}

export async function promptSession(
  sessionId: string,
  texts: string[],
  directory: string,
  model?: SessionModel | null,
): Promise<void> {
  await sendProviderMessage({
    sessionId,
    directory,
    content: texts.join("\n\n"),
    model,
    agentId: "browser",
  });
}

export async function abortSession(
  sessionId: string,
  directory: string,
): Promise<void> {
  await abortProviderSession(sessionId, directory);
}
