import { useDirectoryStore, useMessageStore, useSessionStore } from "@/stores";
import type { ModelConfig } from "@/types";

export function useChatWorkspace() {
    const loadMessages = useMessageStore(s => s.loadMessages);
    const sendMessage = useMessageStore(s => s.sendMessage);
    const abortGeneration = useMessageStore(s => s.abortGeneration);
    const selectedDirectory = useDirectoryStore(s => s.selectedDirectory);
    const selectedSessionId = useSessionStore(s => s.selectedSessionId);
    const createSession = useSessionStore(s => s.createSession);

    return {
        createSession: (title?: string) => {
            if (!selectedDirectory) {
                return;
            }

            createSession(selectedDirectory, title)
        },
        loadMessages: () => {
            if (!selectedSessionId) {
                return;
            }
            return loadMessages(selectedSessionId)
        },
        sendMessage: async (text: string, model?: ModelConfig | null) => {
            if (!selectedSessionId || !selectedDirectory) return;

            await sendMessage(selectedDirectory, selectedSessionId, text, model);
        },
        abortGeneration: async () => {
            if (!selectedSessionId) {
                return;
            }
            await abortGeneration(selectedSessionId);
        }
    };
}