import { ConflictError, NotFoundError } from "../../shared/domain-error";

export class LLMProviderConflictError extends ConflictError {
  constructor(message: string) {
    super(message);
  }
}

export class LLMProviderNotFoundError extends NotFoundError {
  constructor(message: string) {
    super(message);
  }
}
