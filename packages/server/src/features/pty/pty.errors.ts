import { NotFoundError } from "../../shared/domain-error";

/** Thrown when a PTY session lookup misses. Maps to HTTP 404. */
export class SessionNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`PTY session ${id} not found`);
  }
}
