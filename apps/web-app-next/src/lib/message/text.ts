import type { Part } from "@opencode-ai/sdk/v2";

export function getTextFromParts(parts: Part[]): string {
  const texts = parts
    .filter((part) => part.type === "text")
    .map((part) => (part as unknown as { text: string }).text.trim());

  if (!texts.length) {
    return "";
  }

  return texts[0];
}
