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
  request: {
    root: () => ["permissions", "request"] as const,
    list: (directory: string) => ["permissions", "request", "list", directory] as const,
  },
  saved: {
    root: () => ["permissions", "saved"] as const,
    list: (projectId?: string) => ["permissions", "saved", "list", projectId ?? "all"] as const,
  },
};

export const questionKeys = {
  root: () => ["questions"] as const,
  list: (directory: string) => ["questions", "list", directory] as const,
};
