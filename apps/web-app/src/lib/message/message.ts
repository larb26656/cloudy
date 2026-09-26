import type { Message } from "@/types";

export function traverseByParentId(
  messages: Message[],
  parentId: string,
): Message[] {
  const childMessage: Message[] = [];

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const rawMessage = message as unknown as Record<string, unknown>;
    const rawInfo =
      rawMessage.info && typeof rawMessage.info === "object"
        ? (rawMessage.info as Record<string, unknown>)
        : undefined;
    const role = message.role ?? rawInfo?.role;

    // message from user will be ignore
    if (role === "user") {
      continue;
    }

    const raw = message.metadata?.raw ?? rawInfo;
    if (
      typeof raw === "object" &&
      raw !== null &&
      "parentID" in raw &&
      raw.parentID === parentId
    ) {
      childMessage.push(message);
    }
  }

  return childMessage;
}
