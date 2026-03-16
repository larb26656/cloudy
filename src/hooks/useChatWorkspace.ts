import { useDirectoryStore, useMessageStore, useSessionStore } from "@/stores";
import type { ModelConfig } from "@/types";

export function useChatWorkspace() {
    const loadMessages = useMessageStore(s => s.loadMessages);
    const sendMessage = useMessageStore(s => s.sendMessage);
    const abortGeneration = useMessageStore(s => s.abortGeneration);
    const selectedDirectory = useDirectoryStore(s => s.selectedDirectory);
    const selectedSessionId = useSessionStore(s => s.selectedSessionId);
    const createSessionFromStore = useSessionStore(s => s.createSession);
    const setSelectedDirectory = useDirectoryStore(s => s.setSelectedDirectory);

    return {
        createSession: (directory?: string, title?: string) => {
            const dir = directory || selectedDirectory;
            if (!dir) {
                return;
            }

            if (directory && directory !== selectedDirectory) {
                setSelectedDirectory(directory);
            }

            createSessionFromStore(dir, title)
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