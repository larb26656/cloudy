export const sessionKeys = {
  root: () => ["sessions"] as const,
  infinite: (directory: string) =>
    ["sessions", "infinite", directory] as const,
  detail: (sessionId: string) => ["sessions", "detail", sessionId] as const,
};

export const messageKeys = {
  root: () => ["messages"] as const,
  list: (sessionId: string) => ["messages", "list", sessionId] as const,
  infinite: (sessionId: string) => ["messages", "infinite", sessionId] as const,
};

export const agentKeys = {
  root: () => ["agents"] as const,
  list: () => ["agents", "list"] as const,
};

export const modelKeys = {
  root: () => ["models"] as const,
  providers: () => ["models", "providers"] as const,
};

export const permissionKeys = {
  root: () => ["permissions"] as const,
  list: (directory: string) => ["permissions", "list", directory] as const,
};

export const questionKeys = {
  root: () => ["questions"] as const,
  list: (directory: string) => ["questions", "list", directory] as const,
};
