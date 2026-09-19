export const sessionMessageKeys = {
  root: () => ["extension", "session-messages"] as const,
  detail: (directory: string, sessionId: string) =>
    ["extension", "session-messages", directory, sessionId] as const,
};

export const sessionKeys = {
  root: () => ["extension", "sessions"] as const,
  list: (directory: string) => ["extension", "sessions", directory] as const,
};
