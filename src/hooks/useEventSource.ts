// hooks/useEventSource.ts
import { useEffect, useRef } from 'react';
import { createEventSource } from '../api';
import { useSessionStore } from '../stores/sessionStore';
import { useMessageStore } from '../stores/messageStore';
import type { SessionStatus } from '../types';

// Event from API has 'type' and 'properties' structure
interface ApiEventData {
  type: string;
  properties?: Record<string, unknown>;
}

export function useEventSource(directory: string | null) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const updateSessionStatus = useSessionStore((state) => state.updateSessionStatus);
  const updateSessionFromEvent = useSessionStore((state) => state.updateSessionFromEvent);
  const addSession = useSessionStore((state) => state.addSession);
  const removeSession = useSessionStore((state) => state.removeSession);
  const handleMessageEvent = useMessageStore((state) => state.handleEvent);

  useEffect(() => {
    if (!directory) return;

    const es = createEventSource(directory);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data: ApiEventData = JSON.parse(event.data);
        const props = data.properties || {};
        
        switch (data.type) {
          case 'message.part.delta':
            if (props.sessionID && props.messageID && props.delta) {
              handleMessageEvent({
                event: 'message.part.delta',
                sessionID: props.sessionID as string,
                messageID: props.messageID as string,
                partID: props.partID as string,
                delta: props.delta as string,
              });
            }
            break;

          case 'message.part.updated':
            if (props.sessionID && props.messageID && props.part) {
              handleMessageEvent({
                event: 'message.part.updated',
                sessionID: props.sessionID as string,
                messageID: props.messageID as string,
                part: props.part as { type: string; text: string },
              });
            }
            break;

          case 'session.idle':
            if (props.sessionID) {
              handleMessageEvent({
                event: 'session.idle',
                sessionID: props.sessionID as string,
              });
              updateSessionStatus(props.sessionID as string, 'idle');
            }
            break;

          case 'message.created':
          case 'message.updated':
            // Reload messages when a new message is created or updated
            if (props.sessionID && props.message) {
              console.log('Message event:', data.type, props.message);
              // The message store will handle this via the event handler
            }
            break;
            
          case 'message.removed':
            // Handle message removal if needed
            break;

          case 'session.created':
            if (props.session && typeof props.session === 'object') {
              addSession(props.session as Parameters<typeof addSession>[0]);
            }
            break;

          case 'session.updated':
            if (props.session && typeof props.session === 'object') {
              updateSessionFromEvent(props.session as Parameters<typeof updateSessionFromEvent>[0]);
            }
            break;

          case 'session.deleted':
            if (props.sessionID) {
              removeSession(props.sessionID as string);
            }
            break;

          case 'session.status':
            if (props.sessionID && props.status) {
              const status = typeof props.status === 'string' 
                ? props.status as SessionStatus 
                : (props.status as { type: string }).type as SessionStatus;
              updateSessionStatus(props.sessionID as string, status);
            }
            break;

          case 'session.compacted':
          case 'session.error':
            console.log('Session event:', data.type, props);
            break;

          // Phase 2: Handle reasoning events
          case 'reasoning.start':
            if (props.sessionID && props.messageID) {
              handleMessageEvent({
                event: 'reasoning.start',
                sessionID: props.sessionID as string,
                messageID: props.messageID as string,
              });
            }
            break;

          case 'reasoning.delta':
            if (props.sessionID && props.messageID && props.text) {
              handleMessageEvent({
                event: 'reasoning.delta',
                sessionID: props.sessionID as string,
                messageID: props.messageID as string,
                text: props.text as string,
              });
            }
            break;

          case 'reasoning.complete':
            if (props.sessionID && props.messageID) {
              handleMessageEvent({
                event: 'reasoning.complete',
                sessionID: props.sessionID as string,
                messageID: props.messageID as string,
              });
            }
            break;

          // Phase 2: Handle tool events
          case 'tool.start':
            if (props.sessionID && props.messageID && props.tool) {
              handleMessageEvent({
                event: 'tool.start',
                sessionID: props.sessionID as string,
                messageID: props.messageID as string,
                partID: (props.partID || props.toolCallID) as string,
                tool: props.tool as string,
                arguments: (props.arguments || props.args || {}) as Record<string, unknown>,
              });
            }
            break;

          case 'tool.progress':
            if (props.sessionID && props.messageID && props.progress !== undefined) {
              handleMessageEvent({
                event: 'tool.progress',
                sessionID: props.sessionID as string,
                messageID: props.messageID as string,
                partID: (props.partID || props.toolCallID) as string,
                progress: props.progress as number,
                status: (props.status || 'Running...') as string,
              });
            }
            break;

          case 'tool.complete':
            if (props.sessionID && props.messageID) {
              handleMessageEvent({
                event: 'tool.complete',
                sessionID: props.sessionID as string,
                messageID: props.messageID as string,
                partID: (props.partID || props.toolCallID) as string,
                result: props.result,
              });
            }
            break;

          case 'tool.error':
            if (props.sessionID && props.messageID && props.error) {
              handleMessageEvent({
                event: 'tool.error',
                sessionID: props.sessionID as string,
                messageID: props.messageID as string,
                partID: (props.partID || props.toolCallID) as string,
                error: props.error as string,
              });
            }
            break;

          case 'ping':
          case 'server.connected':
            // Keep-alive, no action needed
            break;

          default:
            // Only log unknown event types once
            console.log('Unknown event:', data.type, props);
        }
      } catch (error) {
        console.error('Failed to parse event:', error);
      }
    };

    es.onerror = (error) => {
      console.error('EventSource error:', error);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [directory, updateSessionStatus, updateSessionFromEvent, addSession, removeSession, handleMessageEvent]);

  return eventSourceRef.current;
}
