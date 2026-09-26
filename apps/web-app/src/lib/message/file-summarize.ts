import type { Message, MessageFileItem } from "@/types";

function applyEdits(
  content: string,
  oldString: string,
  newString: string,
): string {
  const index = content.indexOf(oldString);
  if (index === -1) {
    return content;
  }
  return (
    content.slice(0, index) +
    newString +
    content.slice(index + oldString.length)
  );
}

export function extractFromParts(
  parts: Message["parts"] | readonly Record<string, unknown>[],
): MessageFileItem[] {
  const pathOperations = new Map<
    string,
    { baseContent: string; type: "write" | "edit"; originalContent: string }
  >();

  for (const part of parts) {
    const raw = part as Record<string, unknown>;
    if (raw.type !== "tool") continue;

    const state =
      raw.state && typeof raw.state === "object"
        ? (raw.state as Record<string, unknown>)
        : {};
    const inputValue = raw.input ?? state.input;
    const input =
      inputValue && typeof inputValue === "object"
        ? (inputValue as Record<string, unknown>)
        : {};
    const path =
      "filePath" in input && typeof input.filePath === "string"
        ? input.filePath
        : null;
    if (!path) continue;

    const toolName = typeof raw.toolName === "string" ? raw.toolName : raw.tool;
    if (toolName === "write") {
      const content = String("content" in input ? input.content : "");
      pathOperations.set(path, {
        baseContent: content,
        type: "write",
        originalContent: "",
      });
    } else if (toolName === "edit") {
      const newString = String("newString" in input ? input.newString : "");
      const oldString = String("oldString" in input ? input.oldString : "");
      const existing = pathOperations.get(path);

      if (existing) {
        const newContent = applyEdits(
          existing.baseContent,
          oldString,
          newString,
        );
        pathOperations.set(path, { ...existing, baseContent: newContent });
      } else {
        pathOperations.set(path, {
          baseContent: newString,
          type: "edit",
          originalContent: oldString,
        });
      }
    }
  }

  const result: MessageFileItem[] = [];

  for (const [path, { baseContent, type, originalContent }] of pathOperations) {
    const item: MessageFileItem = {
      name: path,
      path,
      type,
      content: baseContent,
    };

    if (type === "edit") {
      item.originalContent = originalContent;
    }

    result.push(item);
  }

  return result;
}

export function extractFromMessage(message: Message): MessageFileItem[] {
  return extractFromParts(message.parts);
}

export function extractFromMessages(messages: Message[]): MessageFileItem[] {
  const fileMap = new Map<string, MessageFileItem>();

  for (const message of messages) {
    const parts = extractFromMessage(message);
    for (const file of parts) {
      fileMap.set(file.path, file);
    }
  }

  return Array.from(fileMap.values());
}
