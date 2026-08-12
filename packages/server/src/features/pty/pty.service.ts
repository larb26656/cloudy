import { randomInt } from "node:crypto";
import type {
  CreateSessionInput,
  ResizeInput,
  SessionDto,
  ShellDto,
  UpdateSessionInput,
} from "./pty.model";
import type {
  DataListener,
  ExitListener,
  PtyRepository,
  PtySession,
} from "./pty.repository";
import { listShells } from "./shell-resolver";
import { SessionNotFoundError } from "./pty.errors";

/**
 * PTY business logic. Framework-free — throws `SessionNotFoundError` (a
 * `DomainError` subclass) on missing sessions; the HTTP edge maps that to 404.
 * The repository owns node-pty wiring; this object only orchestrates and
 * shapes DTOs so routes stay thin.
 */
export function createPtyService(repo: PtyRepository) {
  const adjectives = ["Amber", "Brisk", "Calm", "Clever", "Quiet", "Swift"];
  const nouns = ["Comet", "Harbor", "Meadow", "Orbit", "Pine", "River"];
  const randomName = (): string => {
    const adjective = adjectives[randomInt(adjectives.length)]!;
    const noun = nouns[randomInt(nouns.length)]!;
    return `${adjective} ${noun}`;
  };

  const toDto = (session: PtySession): SessionDto => ({
    id: session.id,
    name: session.name,
    directory: session.directory,
    command: session.command,
    alive: session.exitCode === null,
    exitCode: session.exitCode,
    createdAt: session.createdAt,
    lastActivityAt: session.lastActivityAt,
  });

  const listShellsFn = (): ShellDto[] =>
    listShells().map((s) => ({ path: s.path, acceptable: s.acceptable }));

  const createSession = (input: CreateSessionInput): SessionDto => {
    const session = repo.spawn({
      directory: input.directory,
      name: input.name ?? randomName(),
      command: input.command,
      cols: input.cols,
      rows: input.rows,
      env: input.env,
    });
    return toDto(session);
  };

  const getSession = (id: string): SessionDto => {
    const session = repo.get(id);
    if (!session) throw new SessionNotFoundError(id);
    return toDto(session);
  };

  const listSessions = (): SessionDto[] =>
    repo
      .list()
      .sort((a, b) => b.lastActivityAt - a.lastActivityAt)
      .map(toDto);

  const resize = (id: string, input: ResizeInput): void => {
    if (!repo.get(id)) throw new SessionNotFoundError(id);
    repo.resize(id, input.cols, input.rows);
  };

  const kill = (id: string): void => {
    if (!repo.get(id)) throw new SessionNotFoundError(id);
    repo.kill(id);
  };

  const killAll = (): void => repo.killAll();

  const updateSession = (id: string, input: UpdateSessionInput): SessionDto => {
    if (!repo.get(id)) throw new SessionNotFoundError(id);
    repo.rename(id, input.name);
    return getSession(id);
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

  return {
    listShells: listShellsFn,
    createSession,
    getSession,
    listSessions,
    updateSession,
    resize,
    kill,
    killAll,
    write,
    onData,
    onExit,
  };
}

export type PtyService = ReturnType<typeof createPtyService>;
