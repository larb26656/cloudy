import { RotateCcw } from "lucide-react";
import { Terminal as XTermTerminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  useTerminalPty,
  type TerminalStatus,
} from "./useTerminalPty";

interface TerminalViewProps {
  /** Working directory the shell starts in (workspace.directory). */
  directory: string;
  /** Current PTY id (null while not yet spawned). */
  ptyId: string | null;
  /** Notified when a PTY is allocated/released so the owner can persist it. */
  onPtyChange: (id: string | null) => void;
  className?: string;
}

export function TerminalView({
  directory,
  ptyId,
  onPtyChange,
  className,
}: TerminalViewProps) {
  const { containerRef, status, error, reconnect } = useTerminalPty({
    directory,
    ptyId,
    onPtyChange,
  });

  const overlay = renderOverlay(status, error, reconnect);

  return (
    <div className={cn("relative bg-black text-white", className)}>
      <div ref={containerRef} className="h-full w-full p-1" />
      {overlay && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-center">
          {overlay}
        </div>
      )}
    </div>
  );
}

function renderOverlay(
  status: TerminalStatus,
  error: string | null,
  reconnect: () => void,
) {
  if (status === "connected" || status === "connecting") {
    if (status === "connecting") {
      return <p className="text-sm text-muted-foreground">Connecting…</p>;
    }
    return null;
  }
  if (status === "spawning") {
    return <p className="text-sm text-muted-foreground">Starting shell…</p>;
  }
  if (status === "exited") {
    return (
      <>
        <p className="text-sm text-muted-foreground">
          Shell exited.
        </p>
        <Button variant="outline" size="sm" onClick={reconnect}>
          <RotateCcw className="size-4 mr-2" />
          Restart
        </Button>
      </>
    );
  }
  if (status === "error") {
    return (
      <>
        <p className="text-sm text-destructive">
          {error ?? "Terminal error"}
        </p>
        <Button variant="outline" size="sm" onClick={reconnect}>
          <RotateCcw className="size-4 mr-2" />
          Retry
        </Button>
      </>
    );
  }
  return null;
}

export type { TerminalViewProps };
export type { TerminalStatus } from "./useTerminalPty";
export type { XTermTerminal as Terminal };
