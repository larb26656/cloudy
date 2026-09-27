import { NotFoundError, ValidationError } from "../shared/domain-error";

export class ProviderNotFoundError extends NotFoundError {
  constructor(providerId: string) {
    super(`Provider not found: ${providerId}`);
  }
}

export class UnsupportedProviderOperationError extends ValidationError {
  constructor(providerId: string, operation: string) {
    super(`Provider ${providerId} does not support ${operation}`);
  }
}
