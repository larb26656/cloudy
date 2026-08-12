import type { IPty } from "@lydell/node-pty";

export interface PtySession {
  id: string;
  name: string;
  pty: IPty;
  directory: string;
  command: string;
  exitCode: number | null;
  createdAt: number;
  lastActivityAt: number;
}

export interface PtySpawnInput {
  directory: string;
  name: string;
  command?: string;
  cols?: number;
  rows?: number;
  env?: Record<string, string>;
}

export type DataListener = (data: string) => void;
export type ExitListener = (code: number, signal?: number) => void;

/**
 * Persistence/process boundary for PTY sessions. The service layer depends on
 * this interface; the in-memory implementation lives in
 * `in-memory-pty.repository.ts`. A future Drizzle-backed implementation would
 * satisfy the same shape.
 */
export interface PtyRepository {
  spawn(input: PtySpawnInput): PtySession;
  get(id: string): PtySession | null;
  list(): PtySession[];
  resize(id: string, cols: number, rows: number): void;
  write(id: string, data: string): void;
  rename(id: string, name: string): void;
  kill(id: string): void;
  killAll(): void;
  onData(id: string, fn: DataListener): () => void;
  onExit(id: string, fn: ExitListener): () => void;
}
