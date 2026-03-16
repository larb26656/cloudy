import { useMessageStore } from "@/stores/messageStore"
import { useSessionStore } from "@/stores/sessionStore"
import type { Event } from "@opencode-ai/sdk/v2";

export function handleEvent(event: Event) {

    const messageStore = useMessageStore.getState()
    const sessionStore = useSessionStore.getState()

    switch (event.type) {

        case 'message.updated':
            {
                const props = event.properties;
                messageStore.updateMessage(props.info)
                break;
            }

        case 'message.part.delta':
            {
                const props = event.properties;
                messageStore.appendStreamChunk(props.sessionID, props.messageID, props.delta);
                break;
            }

        case 'message.part.updated':
            {
                const props = event.properties;
                messageStore.updateMessagePart(props.part);
            }

            break;
        // TODO handle session event
    }

}
