import type {
  CreateSessionInput,
  ResizeInput,
  SessionDto,
  ShellDto,
} from "./pty.model";
import type { DataListener, ExitListener, PtyRepository } from "./pty.repository";
import { listShells } from "./shell-resolver";
import { SessionNotFoundError } from "./pty.errors";

/**
 * PTY business logic. Framework-free — throws `SessionNotFoundError` (a
 * `DomainError` subclass) on missing sessions; the HTTP edge maps that to 404.
 * The repository owns node-pty wiring; this object only orchestrates and
 * shapes DTOs so routes stay thin.
 */
export function createPtyService(repo: PtyRepository) {
  const listShellsFn = (): ShellDto[] =>
    listShells().map((s) => ({ path: s.path, acceptable: s.acceptable }));

  const createSession = (input: CreateSessionInput): { id: string } => {
    const session = repo.spawn({
      directory: input.directory,
      command: input.command,
      cols: input.cols,
      rows: input.rows,
      env: input.env,
    });
    return { id: session.id };
  };

  const getSession = (id: string): SessionDto => {
    const session = repo.get(id);
    if (!session) throw new SessionNotFoundError(id);
    return {
      id: session.id,
      alive: session.exitCode === null,
      exitCode: session.exitCode,
    };
  };

  const resize = (id: string, input: ResizeInput): void => {
    if (!repo.get(id)) throw new SessionNotFoundError(id);
    repo.resize(id, input.cols, input.rows);
  };

  const kill = (id: string): void => {
    if (!repo.get(id)) throw new SessionNotFoundError(id);
    repo.kill(id);
  };

  const write = (id: string, data: string): void => {
    if (!repo.get(id)) throw new SessionNotFoundError(id);
    repo.write(id, data);
  };

  /** Subscribe to stdout/stderr bytes. Returns an unsubscribe function. */
  const onData = (id: string, fn: DataListener): (() => void) => {
    if (!repo.get(id)) throw new SessionNotFoundError(id);
    return repo.onData(id, fn);
  };

  /** Subscribe to exit event. Returns an unsubscribe function. */
  const onExit = (id: string, fn: ExitListener): (() => void) => {
    if (!repo.get(id)) throw new SessionNotFoundError(id);
    return repo.onExit(id, fn);
  };

  return { listShells: listShellsFn, createSession, getSession, resize, kill, write, onData, onExit };
}

export type PtyService = ReturnType<typeof createPtyService>;
