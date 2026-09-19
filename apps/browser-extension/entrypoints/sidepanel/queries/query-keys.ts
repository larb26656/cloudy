export const sessionMessageKeys = {
  root: () => ["extension", "session-messages"] as const,
  detail: (directory: string, sessionId: string) =>
    ["extension", "session-messages", directory, sessionId] as const,
};
