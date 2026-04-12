import type { Message, MessageFileItem } from "@/types";
import type { Part } from "@opencode-ai/sdk/v2";

function applyEdits(content: string, oldString: string, newString: string): string {
    const index = content.indexOf(oldString);
    if (index === -1) {
        return content;
    }
    return content.slice(0, index) + newString + content.slice(index + oldString.length);
}

export function extractFromParts(parts: Part[]): MessageFileItem[] {
    const pathOperations = new Map<
        string,
        { baseContent: string; type: "write" | "edit"; originalContent: string }
    >();

    for (const part of parts) {
        if (part.type !== "tool") continue;

        const path = (part.state.input.filePath as string) ?? null;
        if (!path) continue;

        if (part.tool === "write") {
            const content = part.state.input.content as string;
            pathOperations.set(path, { baseContent: content, type: "write", originalContent: "" });
        } else if (part.tool === "edit") {
            const newString = part.state.input.newString as string;
            const oldString = part.state.input.oldString as string;
            const existing = pathOperations.get(path);

            if (existing) {
                const newContent = applyEdits(existing.baseContent, oldString, newString);
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
