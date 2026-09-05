import { NotFoundError } from "../../shared/domain-error";

/** Thrown when a notification delete misses. Maps to HTTP 404. */
export class NotificationNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Notification ${id} not found`);
  }
}
