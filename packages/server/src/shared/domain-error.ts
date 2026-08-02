/**
 * Base class for all domain-layer errors. Services throw subclasses of this
 * instead of `HTTPException` so the service layer stays free of any HTTP /
 * framework dependency. `presentation/error-middleware.ts` inspects the
 * `kind` field to map each error to an HTTP status at the controller edge.
 *
 * `status` is included on the instance so existing tests that assert on
 * `error.status` (e.g. `toThrow({ status: 404 })`) keep working without
 * referencing HTTP directly from the service.
 */
export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

export type DomainErrorKind =
  | "not_found"
  | "validation"
  | "conflict"
  | "unauthorized";

export class NotFoundError extends DomainError {
  readonly kind = "not_found" as const;
  constructor(message: string) {
    super(404, message);
  }
}

export class ValidationError extends DomainError {
  readonly kind = "validation" as const;
  constructor(message: string) {
    super(400, message);
  }
}

export class ConflictError extends DomainError {
  readonly kind = "conflict" as const;
  constructor(message: string) {
    super(409, message);
  }
}

export class UnauthorizedError extends DomainError {
  readonly kind = "unauthorized" as const;
  constructor(message: string) {
    super(401, message);
  }
}
