// api/messages.ts
import { api } from './client';
import type { Message, SendMessageRequest } from '../types';

export const messagesApi = {
  list: (sessionId: string): Promise<Message[]> => {
    return api.get(`/session/${sessionId}/message`);
  },

  get: (sessionId: string, messageId: string): Promise<Message> => {
    return api.get(`/session/${sessionId}/message/${messageId}`);
  },

  send: (sessionId: string, data: SendMessageRequest): Promise<Message> => {
    return api.post(`/session/${sessionId}/message`, data);
  },

  sendAsync: (sessionId: string, data: SendMessageRequest): Promise<{ id: string }> => {
    return api.post(`/session/${sessionId}/prompt_async`, data);
  },

  deletePart: (sessionId: string, messageId: string, partId: string): Promise<void> => {
    return api.delete(`/session/${sessionId}/message/${messageId}/part/${partId}`);
  },

  updatePart: (
    sessionId: string,
    messageId: string,
    partId: string,
    data: { text?: string; synthetic?: boolean; ignored?: boolean }
  ): Promise<void> => {
    return api.patch(`/session/${sessionId}/message/${messageId}/part/${partId}`, data);
  },
};
