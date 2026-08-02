import { ValidationError } from "../../shared/domain-error";

/** Thrown when no opencode API base URL is configured. Maps to HTTP 400. */
export class MissingApiBaseError extends ValidationError {
  constructor() {
    super(
      "Missing opencodeApiBase config. Set opencodeApiBase in config.json, CLOUDY_OPENCODE_API_BASE env, or --opencode-api-base CLI flag",
    );
  }
}
