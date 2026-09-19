import { type Session } from "@opencode-ai/sdk/v2/client";
import type { Message } from "@repo/ui/components/message/types";
import { createClient, getErrorMessage } from "./client";

export async function createBotSession(directory: string): Promise<Session> {
  const result = await createClient(directory).session.create({
    directory,
    agent: "bot",
  });
  if (result.error) throw new Error(getErrorMessage(result.error));
  return result.data;
}

export async function listSessions(directory: string): Promise<Session[]> {
  const result = await createClient(directory).session.list({ directory });
  if (result.error) throw new Error(getErrorMessage(result.error));
  return result.data;
}

export async function loadSessionMessages(
  sessionId: string,
  directory: string,
): Promise<Message[]> {
  const result = await createClient(directory).session.messages({
    sessionID: sessionId,
    directory,
  });
  if (result.error) throw new Error(getErrorMessage(result.error));

  return result.data.map(toMessage);
}

export function toMessage(message: Message): Message {
  return {
    info: message.info,
    parts: message.parts,
  };
}

export async function sendPrompt(
  sessionId: string,
  text: string,
  directory: string,
): Promise<void> {
  const result = await createClient(directory).session.promptAsync({
    sessionID: sessionId,
    directory,
    agent: "bot",
    parts: [{ type: "text", text }],
  });
  if (result.error) throw new Error(getErrorMessage(result.error));
}

export async function abortSession(
  sessionId: string,
  directory: string,
): Promise<void> {
  const result = await createClient(directory).session.abort({
    sessionID: sessionId,
    directory,
  });
  if (result.error) throw new Error(getErrorMessage(result.error));
}
