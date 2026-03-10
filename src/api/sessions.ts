// api/sessions.ts
import { api } from './client';
import type {
  Session,
  SessionStatusInfo,
  ListSessionsParams,
  CreateSessionRequest,
  UpdateSessionRequest,
  ForkSessionRequest,
} from '../types';

export const sessionsApi = {
  list: (params?: ListSessionsParams): Promise<Session[]> => {
    return api.get('/session', params as Record<string, unknown>);
  },

  get: (sessionId: string): Promise<Session> => {
    return api.get(`/session/${sessionId}`);
  },

  create: (data?: CreateSessionRequest, directory?: string): Promise<Session> => {
    const headers: Record<string, string> = {};
    if (directory) {
      headers['x-opencode-directory'] = directory;
    }
    return api.post('/session', data, headers);
  },

  update: (sessionId: string, data: UpdateSessionRequest): Promise<Session> => {
    return api.patch(`/session/${sessionId}`, data);
  },

  delete: (sessionId: string): Promise<void> => {
    return api.delete(`/session/${sessionId}`);
  },

  fork: (sessionId: string, data: ForkSessionRequest, directory?: string): Promise<Session> => {
    const headers: Record<string, string> = {};
    if (directory) {
      headers['x-opencode-directory'] = directory;
    }
    return api.post(`/session/${sessionId}/fork`, data, headers);
  },

  getChildren: (sessionId: string): Promise<Session[]> => {
    return api.get(`/session/${sessionId}/children`);
  },

  getStatus: (): Promise<SessionStatusInfo> => {
    return api.get('/session/status');
  },

  abort: (sessionId: string): Promise<void> => {
    return api.post(`/session/${sessionId}/abort`);
  },

  revert: (sessionId: string, messageId: string): Promise<void> => {
    return api.post(`/session/${sessionId}/revert`, { messageID: messageId });
  },

  unrevert: (sessionId: string): Promise<void> => {
    return api.post(`/session/${sessionId}/unrevert`);
  },

  summarize: (sessionId: string): Promise<void> => {
    return api.post(`/session/${sessionId}/summarize`);
  },
};
