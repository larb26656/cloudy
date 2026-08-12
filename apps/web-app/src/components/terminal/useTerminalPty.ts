import { useCallback, useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { env } from "@/config/env";
import {
  useCreatePtySession,
  useKillPtySession,
  useResizePtySession,
} from "@/hooks/queries";

export type TerminalStatus =
  | "idle"
  | "spawning"
  | "connecting"
  | "connected"
  | "exited"
  | "error";

export interface UseTerminalPtyOptions {
  /** Working directory the shell starts in. */
  directory: string;
  /** Current PTY id, or `null` when none is allocated yet. */
  ptyId: string | null;
  /** Called when a PTY is created (id) or torn down (null). */
  onPtyChange: (id: string | null) => void;
}

export interface UseTerminalPtyResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  status: TerminalStatus;
  error: string | null;
  reconnect: () => void;
}

/**
 * Owns the full lifecycle of a terminal session backed by the cloudy PTY
 * RPC API (via React Query mutations/queries) plus a WebSocket stream.
 * Shared by both the terminal tab and the terminal desk node so they
 * behave identically: spawn (if needed) → open xterm → open WebSocket →
 * pipe stdin/stdout → resize sync.
 *
 * The PTY is NOT removed on unmount so it can be transferred between a
 * node and a tab ("Open in tab"); final cleanup is the caller's
 * responsibility (tab/node `onClose`).
 */
export function useTerminalPty({
  directory,
  ptyId,
  onPtyChange,
}: UseTerminalPtyOptions): UseTerminalPtyResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<TerminalStatus>(ptyId ? "connecting" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const onPtyChangeRef = useRef(onPtyChange);
  onPtyChangeRef.current = onPtyChange;

  const createPty = useCreatePtySession();
  const killPty = useKillPtySession();
  const resizePty = useResizePtySession();

  const reconnect = useCallback(() => {
    if (ptyId) {
      void killPty.mutateAsync({ id: ptyId }).catch(() => {});
    }
    setReloadKey((k) => k + 1);
    onPtyChangeRef.current(null);
  }, [ptyId, killPty]);

  // 1. Spawn a PTY when we don't yet have one.
  useEffect(() => {
    if (ptyId) return;
    if (!directory) return;
    let cancelled = false;
    setStatus("spawning");
    setError(null);

    (async () => {
      try {
        const { id } = await createPty.mutateAsync({ directory });
        if (cancelled) {
          // Best-effort cleanup of the now-orphaned session.
          void killPty.mutateAsync({ id }).catch(() => {});
          return;
        }
        onPtyChangeRef.current(id);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directory, ptyId, reloadKey]);

  // 2. Attach xterm + WebSocket once a ptyId exists.
  useEffect(() => {
    if (!ptyId) {
      setStatus("idle");
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    setStatus("connecting");
    setError(null);

    const term = new Terminal({
      cursorBlink: true,
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: 13,
      theme: { background: "#000000", foreground: "#e6e6e6" },
      allowProposedApi: true,
      scrollback: 5000,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(container);
    try {
      fit.fit();
    } catch {
      // container may have zero size while hidden; ResizeObserver will refit
    }

    let ws: WebSocket | null = null;
    let lastSentCols = 0;
    let lastSentRows = 0;

    const syncSize = () => {
      if (ws?.readyState !== WebSocket.OPEN) return;
      try {
        fit.fit();
      } catch {
        return;
      }
      const { cols, rows } = term;
      if (cols === lastSentCols && rows === lastSentRows) return;
      if (cols < 1 || rows < 1) return;
      lastSentCols = cols;
      lastSentRows = rows;
      void resizePty
        .mutateAsync({ id: ptyId, cols, rows })
        .catch(() => {});
    };

    const ro = new ResizeObserver(() => syncSize());
    ro.observe(container);

    const onDataDispose = term.onData((data) => {
      if (ws?.readyState === WebSocket.OPEN) ws.send(data);
    });

    ws = new WebSocket(buildPtyWsUrl(ptyId));
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      if (disposed) return;
      setStatus("connected");
      syncSize();
    };
    ws.onmessage = async (e) => {
      if (disposed) return;
      let text: string;
      if (typeof e.data === "string") {
        text = e.data;
      } else if (e.data instanceof ArrayBuffer) {
        text = new TextDecoder().decode(e.data);
      } else {
        text = await (e.data as Blob).text();
      }
      term.write(text);
    };
    ws.onerror = () => {
      if (disposed) return;
      setError("Terminal connection error");
      setStatus("error");
    };
    ws.onclose = () => {
      if (disposed) return;
      // Only flip to exited if not already in an error state — preserves
      // the more specific error message set by onerror.
      setStatus((prev) => (prev === "error" ? prev : "exited"));
    };

    return () => {
      disposed = true;
      ro.disconnect();
      onDataDispose.dispose();
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        if (ws.readyState === WebSocket.OPEN) ws.close();
      }
      term.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ptyId]);

  return { containerRef, status, error, reconnect };
}

/**
 * Build the PTY WebSocket URL against the cloudy server (same origin as
 * the API client). Swaps scheme to ws/wss.
 */
function buildPtyWsUrl(ptyId: string): string {
  const base = env.getApiUrl().replace(/\/$/, "");
  const wsBase = base.replace(/^http:/i, "ws:").replace(/^https:/i, "wss:");
  return `${wsBase}/api/pty/sessions/${encodeURIComponent(ptyId)}/stream`;
}
