import { useMessageStore, useSessionStore, useQuestionStore } from "@cloudy/core-chat"
import { usePermissionStore } from "@/stores/permissionStore"
import type { Event, QuestionRequest, PermissionRequest, SessionStatus } from "@opencode-ai/sdk/v2";

export function handleEvent(event: Event) {

    const messageStore = useMessageStore.getState()
    const sessionStore = useSessionStore.getState()
    const questionStore = useQuestionStore.getState()
    const permissionStore = usePermissionStore.getState()

    console.log(event)

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

        case 'session.status':
            {
                const props = event.properties;
                sessionStore.updateSessionStatus(props.sessionID, props.status);
                break;
            }

        case 'session.created':
            {
                const props = event.properties;
                sessionStore.setCreateSession(props.info);
                break;
            }

        case 'session.updated':
            {
                const props = event.properties;
                sessionStore.updateSessionFromEvent(props.info);
                break;
            }

        case 'session.deleted':
            {
                const props = event.properties;
                sessionStore.removeSession(props.info.id);
                break;
            }

        case 'session.error':
            {
                const props = event.properties;
                if (props.sessionID) {
                    sessionStore.updateSessionStatus(props.sessionID, 'idle' as unknown as SessionStatus);
                }
                break;
            }

        case 'question.asked':
            {
                const props = event.properties as QuestionRequest;
                sessionStore.setActiveQuestion(props);
                questionStore.addQuestion(props);
                break;
            }

        case 'question.replied':
            {
                const props = event.properties;
                questionStore.removeQuestion(props.sessionID, props.requestID);
                sessionStore.clearActiveQuestion();
                break;
            }

        case 'question.rejected':
            {
                const props = event.properties;
                questionStore.removeQuestion(props.sessionID, props.requestID);
                sessionStore.clearActiveQuestion();
                break;
            }

        case 'permission.asked':
            {
                const props = event.properties as PermissionRequest;
                permissionStore.addPermission(props);
                break;
            }

        case 'permission.replied':
            {
                const props = event.properties;
                permissionStore.removePermission(props.sessionID, props.requestID);
                break;
            }
    }

}
