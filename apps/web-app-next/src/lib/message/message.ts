import type { Message } from "@/types";

export function traverseByParentId(messages: Message[], parentId: string): Message[] {
    const childMessage: Message[] = [];

    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        const info = message.info;

        // message from user will be ignore
        if (info.role === "user") {
            continue;
        }

        if (info.parentID === parentId) {
            childMessage.push(message);
        }
    }


    return childMessage;
}
