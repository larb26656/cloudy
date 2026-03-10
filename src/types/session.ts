// types/session.ts
export interface Session {
  id: string;
  slug: string;
  projectID: string;
  directory: string;
  parentID: string | null;
  title: string | null;
  version: string;
  time: {
    created: number;
    updated: number;
    compacting?: number;
    archived?: number;
  };
  summary?: {
    additions: number;
    deletions: number;
    files: number;
    diffs: string[];
    title?: string;
    body?: string;
  };
  share?: { url: string };
  permission?: PermissionRuleset;
  revert?: unknown;
}

export interface PermissionRuleset {
  allow?: string[];
  deny?: string[];
}

export type SessionStatus = 'idle' | 'busy' | 'retry';

export interface SessionStatusInfo {
  [sessionId: string]: SessionStatus | { type: 'retry'; attempt: number; message: string; next: number };
}
