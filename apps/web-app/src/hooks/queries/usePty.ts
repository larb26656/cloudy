import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cloudyClient } from "@/lib/api";
import { ptyKeys } from "@/lib/cloudy/query-keys";

const PTY_POLL_INTERVAL = 2000;

export interface PtyShell {
  path: string;
  acceptable: boolean;
}

export interface PtySession {
  id: string;
  name: string;
  directory: string;
  command: string;
  alive: boolean;
  exitCode: number | null;
  createdAt: number;
  lastActivityAt: number;
}

export interface CreatePtyInput {
  directory: string;
  name?: string;
  command?: string;
  cols?: number;
  rows?: number;
  env?: Record<string, string>;
}

export interface ResizePtyInput {
  id: string;
  cols: number;
  rows: number;
}

export interface KillPtyInput {
  id: string;
}

export interface UpdatePtyInput {
  id: string;
  name: string;
}

export function usePtySessions() {
  return useQuery({
    queryKey: ptyKeys.sessions(),
    queryFn: async (): Promise<PtySession[]> => {
      const res = await cloudyClient.api.pty.sessions.$get();
      if (!res.ok)
        throw new Error(`Failed to list PTY sessions (${res.status})`);
      return res.json();
    },
    refetchInterval: 5000,
  });
}

/**
 * List shells available on the server. Cached indefinitely — rarely
 * changes within a server lifetime.
 */
export function usePtyShells() {
  return useQuery({
    queryKey: ptyKeys.shells(),
    queryFn: async (): Promise<PtyShell[]> => {
      const res = await cloudyClient.api.pty.shells.$get();
      if (!res.ok) throw new Error(`Failed to list shells (${res.status})`);
      return res.json();
    },
    staleTime: Infinity,
  });
}

/**
 * Poll the status of a PTY session. Used to surface `exitCode` because
 * the raw WebSocket carries no structured exit event — the orchestrator
 * enables polling only while the WS is connected.
 */
export function usePtySession(
  id: string | null,
  opts: { poll?: boolean } = {},
) {
  const { poll = false } = opts;
  return useQuery({
    queryKey: ptyKeys.detail(id ?? ""),
    queryFn: async (): Promise<PtySession> => {
      if (!id) throw new Error("Missing PTY id");
      const res = await cloudyClient.api.pty.sessions[":id"].$get({
        param: { id },
      });
      if (!res.ok)
        throw new Error(`Failed to fetch PTY session (${res.status})`);
      return res.json();
    },
    enabled: !!id,
    refetchInterval: poll ? PTY_POLL_INTERVAL : false,
    refetchIntervalInBackground: false,
  });
}

/**
 * Spawn a new PTY session. Returns the server-owned metadata while the
 * caller persists only the id and directory needed to reconnect.
 */
export function useCreatePtySession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePtyInput): Promise<PtySession> => {
      const res = await cloudyClient.api.pty.sessions.$post({ json: input });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(text || `Failed to spawn PTY (${res.status})`);
      }
      const data = await res.json();
      if (!data?.id) throw new Error("PTY create returned no id");
      return data;
    },
    onSuccess: (session) => {
      void queryClient.invalidateQueries({ queryKey: ptyKeys.sessions() });
      queryClient.setQueryData(ptyKeys.detail(session.id), session);
    },
  });
}

export function useUpdatePtySession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: UpdatePtyInput): Promise<PtySession> => {
      const res = await cloudyClient.api.pty.sessions[":id"].$patch({
        param: { id },
        json: { name },
      });
      if (!res.ok)
        throw new Error(`Failed to rename PTY session (${res.status})`);
      return res.json();
    },
    onSuccess: (session) => {
      queryClient.setQueryData(ptyKeys.detail(session.id), session);
      void queryClient.invalidateQueries({ queryKey: ptyKeys.sessions() });
    },
  });
}

/**
 * Resize the PTY for a session. Fire-and-forget semantics — no cache
 * changes because resize is invisible to other consumers.
 */
export function useResizePtySession() {
  return useMutation({
    mutationFn: async ({ id, cols, rows }: ResizePtyInput): Promise<void> => {
      const res = await cloudyClient.api.pty.sessions[":id"].resize.$post({
        param: { id },
        json: { cols, rows },
      });
      if (!res.ok) {
        throw new Error(`Failed to resize PTY (${res.status})`);
      }
    },
  });
}

/**
 * Kill and remove a PTY session. On success, drop its detail cache entry
 * so any component still mounted with the old id doesn't show stale data.
 */
export function useKillPtySession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: KillPtyInput): Promise<void> => {
      const res = await cloudyClient.api.pty.sessions[":id"].$delete({
        param: { id },
      });
      if (!res.ok) {
        throw new Error(`Failed to kill PTY (${res.status})`);
      }
    },
    onSuccess: (_, { id }) => {
      queryClient.removeQueries({ queryKey: ptyKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: ptyKeys.sessions() });
    },
  });
}

export function useKillAllPtySessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const res = await cloudyClient.api.pty.sessions.$delete();
      if (!res.ok)
        throw new Error(`Failed to stop PTY sessions (${res.status})`);
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ptyKeys.root() });
    },
  });
}
