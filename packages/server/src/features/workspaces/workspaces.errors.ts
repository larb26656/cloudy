import { NotFoundError, ConflictError } from "../../shared/domain-error";

/** Thrown when a workspace lookup misses. Maps to HTTP 404. */
export class WorkspaceNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Workspace ${id} not found`);
  }
}

/** Thrown when a create/update collides on a unique directory. Maps to HTTP 409. */
export class WorkspaceConflictError extends ConflictError {
  constructor(directory: string) {
    super(`Directory "${directory}" is already used by another workspace`);
  }
}
