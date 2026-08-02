import { useCallback, useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { getOcClient, getOcInstanceUrl } from "@/lib/opencode";

export type TerminalStatus =
  | "idle"
  | "spawning"
  | "connecting"
  | "connected"
  | "exited"
  | "error";

export interface UseTerminalPtyOptions {
  /** Working directory the shell starts in (and opencode project scope). */
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
 * Owns the full lifecycle of a terminal session backed by the opencode PTY
 * API. Shared by both the terminal tab and the terminal desk node so they
 * behave identically: spawn (if needed) → open xterm → request a connect
 * ticket → open a WebSocket → pipe stdin/stdout → resize sync. The PTY is
 * NOT removed on unmount so it can be transferred between a node and a tab
 * ("Open in tab"); final cleanup is the caller's responsibility (tab/node
 * `onClose`).
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

  // Keep the latest callback without re-running the spawn effect.
  const onPtyChangeRef = useRef(onPtyChange);
  onPtyChangeRef.current = onPtyChange;

  const reconnect = useCallback(() => {
    // Clean up the previous (e.g. exited) PTY before allocating a new one.
    if (ptyId) {
      void getOcClient()
        .pty.remove({ ptyID: ptyId, directory })
        .catch(() => {});
    }
    setReloadKey((k) => k + 1);
    onPtyChangeRef.current(null);
  }, [ptyId, directory]);

  // 1. Spawn a PTY when we don't yet have one.
  useEffect(() => {
    if (ptyId) return;
    if (!directory) return;
    let cancelled = false;
    setStatus("spawning");
    setError(null);

    (async () => {
      try {
        const oc = getOcClient();
        const shellsRes = await oc.pty.shells({ directory });
        const shells = shellsRes.data ?? [];
        const acceptable =
          shells.find((s) => s.acceptable) ?? shells[0] ?? undefined;

        const created = await oc.pty.create({
          cwd: directory,
          directory,
          command: acceptable?.path,
        });
        if (created.error) throw created.error;
        const newId = created.data?.id;
        if (cancelled) {
          if (newId) {
            await oc.pty
              .remove({ ptyID: newId, directory })
              .catch(() => {});
          }
          return;
        }
        if (!newId) throw new Error("PTY create returned no id");
        onPtyChangeRef.current(newId);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
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
      getOcClient()
        .pty.update({ ptyID: ptyId, size: { cols, rows } })
        .catch(() => {});
    };

    const ro = new ResizeObserver(() => syncSize());
    ro.observe(container);

    const onDataDispose = term.onData((data) => {
      if (ws?.readyState === WebSocket.OPEN) ws.send(data);
    });

    (async () => {
      try {
        const oc = getOcClient();
        const tokenRes = await oc.pty.connectToken({
          ptyID: ptyId,
          directory,
        });
        if (disposed) return;
        if (tokenRes.error) throw tokenRes.error;
        const ticket = tokenRes.data?.ticket;
        if (!ticket) throw new Error("PTY connectToken returned no ticket");

        ws = new WebSocket(buildPtyWsUrl(ptyId, ticket, directory));
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
          setStatus("exited");
        };
      } catch (e) {
        if (disposed) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    })();

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
  }, [ptyId, directory]);

  return { containerRef, status, error, reconnect };
}

/**
 * Build the PTY WebSocket URL against the opencode instance directly (not the
 * cloudy HTTP proxy, which cannot carry a WS upgrade). Swaps the scheme to
 * ws/wss and appends the ticket + directory query params.
 */
function buildPtyWsUrl(
  ptyId: string,
  ticket: string,
  directory: string,
): string {
  const base = getOcInstanceUrl().replace(/\/$/, "");
  const wsBase = base.replace(/^http:/i, "ws:").replace(/^https:/i, "wss:");
  const params = new URLSearchParams({ ticket });
  if (directory) params.set("directory", directory);
  return `${wsBase}/pty/${encodeURIComponent(ptyId)}/connect?${params.toString()}`;
}
