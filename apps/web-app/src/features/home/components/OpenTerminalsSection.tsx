import { SquareTerminal, OctagonX } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  useKillAllPtySessions,
  useKillPtySession,
  usePtySessions,
} from "@/hooks/queries";
import type { PtySession } from "@/hooks/queries";
import { formatRelativeFromTimestamp } from "@/lib/format";
import { TerminalNameInput } from "@/components/terminal";

export function OpenTerminalsSection() {
  const { data: sessions = [], isLoading, error } = usePtySessions();
  const killSession = useKillPtySession();
  const killAll = useKillAllPtySessions();
  const [pendingStop, setPendingStop] = useState<PtySession | "all" | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  const confirmStop = () => {
    if (pendingStop === "all") {
      killAll.mutate();
    } else if (pendingStop) {
      killSession.mutate({ id: pendingStop.id });
    }
    setPendingStop(null);
  };

  let content;
  if (isLoading) {
    content = (
      <LoadingState
        size="inline"
        title="Checking terminals..."
        spinner={false}
      />
    );
  } else if (error) {
    content = (
      <ErrorState size="inline" bare message="Failed to load terminals" />
    );
  } else if (sessions.length === 0) {
    content = (
      <EmptyState
        size="inline"
        icon={SquareTerminal}
        title="No open terminals"
      />
    );
  } else {
    content = (
      <div className="overflow-hidden rounded-xl border border-border">
        {sessions.map((session, index) => {
          return (
            <div
              key={session.id}
              className={`flex items-center gap-3 px-3.5 py-3 ${index > 0 ? "border-t border-border" : ""}`}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <SquareTerminal className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {editingId === session.id ? (
                    <TerminalNameInput
                      sessionId={session.id}
                      initialName={session.name}
                      onDone={() => setEditingId(null)}
                      className="min-w-0 flex-1"
                    />
                  ) : (
                    <span
                      className="truncate text-[13.5px] font-medium"
                      onDoubleClick={() => setEditingId(session.id)}
                    >
                      {session.name}
                    </span>
                  )}
                  <Badge variant={session.alive ? "secondary" : "outline"}>
                    {session.alive
                      ? "Running"
                      : `Exited ${session.exitCode ?? ""}`.trim()}
                  </Badge>
                </div>
                <div className="mt-0.5 flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="truncate font-mono">
                    {session.directory}
                  </span>
                  <span aria-hidden>·</span>
                  <span className="shrink-0">
                    {formatRelativeFromTimestamp(session.lastActivityAt)}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setPendingStop(session)}
                aria-label="Stop terminal"
              >
                <OctagonX className="size-4 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section className="mb-9">
      <div className="mb-3.5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold">Open terminals</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Shells currently held by Cloudy
          </p>
        </div>
        {sessions.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setPendingStop("all")}
          >
            Stop all
          </Button>
        )}
      </div>
      {content}
      <ConfirmDialog
        open={pendingStop !== null}
        onOpenChange={(open) => !open && setPendingStop(null)}
        title={pendingStop === "all" ? "Stop all terminals?" : "Stop terminal?"}
        description={
          pendingStop === "all"
            ? "Every running shell will be terminated. This cannot be undone."
            : "The shell process will be terminated, including any command currently running."
        }
        confirmLabel={pendingStop === "all" ? "Stop all" : "Stop terminal"}
        onConfirm={confirmStop}
        destructive
      />
    </section>
  );
}
