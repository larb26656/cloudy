import { useDirectoryStore, useMessageStore, useSessionStore } from "@/stores";
import type { ModelConfig } from "@/types";

// todo refactor this later
export function useChatWorkspace() {
    const loadMessages = useMessageStore(s => s.loadMessages);
    const sendMessage = useMessageStore(s => s.sendMessage);
    const abortGeneration = useMessageStore(s => s.abortGeneration);
    const loadSessions = useSessionStore(s => s.loadSessions);
    const selectedDirector = useDirectoryStore(s => s.selectedDirectory);
    const selectedSessionId = useSessionStore(s => s.selectedSessionId);
    const createSession = useSessionStore(s => s.createSession);
    const selectSession = useSessionStore(s => s.selectSession);
    const setSelectedDirectory = useDirectoryStore(s => s.setSelectedDirectory);

    return {
        setSelectedDirectory: async (directory: string | null) => {

            setSelectedDirectory(directory)

            if (!directory) {
                return;
            }

            console.log('loaded')

            await loadSessions(directory)

            const sessions = useSessionStore.getState().sessions

            if (sessions.length > 0) {
                const sessionId = sessions[0].id

                selectSession(sessionId)
                await loadMessages(sessionId)
            }

        },
        createSession: (title?: string) => {
            if (!selectedDirector) {
                return;
            }

            createSession(selectedDirector, title)
        },
        selectSession: async (sessionId: string) => {
            selectSession(sessionId)
            await loadMessages(sessionId)
        },
        loadMessages: () => {
            if (!selectedSessionId) {
                return;
            }
            return loadMessages(selectedSessionId)
        },
        sendMessage: async (text: string, model?: ModelConfig | null) => {
            if (!selectedSessionId || !selectedDirector) return;

            await sendMessage(selectedDirector, selectedSessionId, text, model);
        },
        abortGeneration: async () => {
            if (!selectedSessionId) {
                return;
            }
            await abortGeneration(selectedSessionId);
        }
    };
}