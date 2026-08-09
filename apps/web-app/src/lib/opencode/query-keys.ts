export const sessionKeys = {
  root: () => ["sessions"] as const,
  infinite: (directory: string) => ["sessions", "infinite", directory] as const,
  detail: (sessionId: string) => ["sessions", "detail", sessionId] as const,
  children: (sessionId: string) => ["sessions", "children", sessionId] as const,
  statuses: (directory: string) => ["sessions", "statuses", directory] as const,
  recent: (limit: number) => ["sessions", "recent", limit] as const,
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
    list: (directory: string) =>
      ["permissions", "request", "list", directory] as const,
  },
  saved: {
    root: () => ["permissions", "saved"] as const,
    list: (projectId?: string) =>
      ["permissions", "saved", "list", projectId ?? "all"] as const,
  },
};

export const questionKeys = {
  root: () => ["questions"] as const,
  list: (directory: string) => ["questions", "list", directory] as const,
};

export const vcsKeys = {
  root: () => ["vcs"] as const,
  diff: (directory: string) => ["vcs", "diff", directory] as const,
};

export const fileKeys = {
  root: () => ["files"] as const,
  list: (directory: string, path: string) =>
    ["files", "list", directory, path] as const,
  read: (directory: string, path: string) =>
    ["files", "read", directory, path] as const,
  search: (directory: string, query: string) =>
    ["files", "search", directory, query] as const,
};
