import { ConflictError, NotFoundError } from "../../shared/domain-error";

export class SessionNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Session not found: ${id}`);
  }
}

export class SessionConflictError extends ConflictError {
  constructor(providerId: string, providerSessionId: string) {
    super(`Session already exists for ${providerId}: ${providerSessionId}`);
  }
}
