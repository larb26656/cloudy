import { HTTPException } from "hono/http-exception";
import type {
  CreateSessionInput,
  ResizeInput,
  SessionDto,
  ShellDto,
} from "./model";
import {
  PtyRepository,
  listShells,
  type DataListener,
  type ExitListener,
} from "./repository";

/**
 * PTY business logic. Maps domain errors to HTTP semantics via
 * `HTTPException`. The repository owns node-pty wiring; this class only
 * orchestrates and shapes DTOs so routes stay thin.
 */
export class PtyService {
  constructor(private repository: PtyRepository) {}

  listShells(): ShellDto[] {
    return listShells().map((s) => ({ path: s.path, acceptable: s.acceptable }));
  }

  createSession(input: CreateSessionInput): { id: string } {
    const session = this.repository.spawn({
      directory: input.directory,
      command: input.command,
      cols: input.cols,
      rows: input.rows,
      env: input.env,
    });
    return { id: session.id };
  }

  getSession(id: string): SessionDto {
    const session = this.repository.get(id);
    if (!session) throw new HTTPException(404, { message: `PTY session ${id} not found` });
    return {
      id: session.id,
      alive: session.exitCode === null,
      exitCode: session.exitCode,
    };
  }

  resize(id: string, input: ResizeInput): void {
    const session = this.repository.get(id);
    if (!session) throw new HTTPException(404, { message: `PTY session ${id} not found` });
    this.repository.resize(id, input.cols, input.rows);
  }

  kill(id: string): void {
    const session = this.repository.get(id);
    if (!session) throw new HTTPException(404, { message: `PTY session ${id} not found` });
    this.repository.kill(id);
  }

  write(id: string, data: string): void {
    const session = this.repository.get(id);
    if (!session) throw new HTTPException(404, { message: `PTY session ${id} not found` });
    this.repository.write(id, data);
  }

  /** Subscribe to stdout/stderr bytes. Returns an unsubscribe function. */
  onData(id: string, fn: DataListener): () => void {
    const session = this.repository.get(id);
    if (!session) throw new HTTPException(404, { message: `PTY session ${id} not found` });
    return this.repository.onData(id, fn);
  }

  /** Subscribe to exit event. Returns an unsubscribe function. */
  onExit(id: string, fn: ExitListener): () => void {
    const session = this.repository.get(id);
    if (!session) throw new HTTPException(404, { message: `PTY session ${id} not found` });
    return this.repository.onExit(id, fn);
  }
}
