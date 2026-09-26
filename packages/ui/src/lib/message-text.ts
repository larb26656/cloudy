import type { MessagePart } from "@repo/ai-core";

export function getTextFromParts(parts: MessagePart[]): string {
  const texts = parts
    .filter((part) => part.type === "text")
    .map((part) => part.text.trim());

  if (!texts.length) {
    return "";
  }

  return texts[0] ?? "";
}
