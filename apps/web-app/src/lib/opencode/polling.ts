/**
 * Polling interval (ms) for chat-related queries. Acts as a defensive
 * background refresh so data stays fresh even if the SSE stream is unhealthy.
 * Paused automatically when the browser tab is hidden (refetchIntervalInBackground).
 */
export const CHAT_POLL_INTERVAL = 15_000;
