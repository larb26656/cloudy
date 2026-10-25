import { useState } from "react";
import {
  Activity,
  Check,
  Copy,
  Eye,
  FileText,
  MoreVertical,
  Play,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { MarkdownRenderer } from "@repo/ui/components/markdown";
import type { Run } from "@/hooks/queries/useAutomations";

interface RunHistorySectionProps {
  runs: Run[];
  runsLoading: boolean;
  runsError: Error | null;
  highlightedRunId: string | null;
  onRun: () => void;
  onStop: (run: Run) => void;
  onOpenSession: (run: Run) => void;
}

export function RunHistorySection({
  runs,
  runsLoading,
  runsError,
  highlightedRunId,
  onRun,
  onStop,
  onOpenSession,
}: RunHistorySectionProps) {
  return (
    <section className="flex min-h-[280px] flex-col rounded-xl border p-4 md:min-h-[340px] md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-3 text-lg font-semibold">
            <FileText aria-hidden="true" />
            Run history
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Past runs of this automation with captured output and logs.
          </p>
        </div>
        {!runsLoading && !runsError && runs.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {runs.length} runs
          </span>
        )}
      </div>
      {runsLoading ? (
        <LoadingState size="inline" title="Loading runs..." />
      ) : runsError ? (
        <ErrorState size="inline" bare message={runsError.message} />
      ) : runs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <Activity
            className="mb-4 size-12 text-muted-foreground/60"
            aria-hidden="true"
          />
          <EmptyState
            size="compact"
            title="No runs yet"
            description="Run it now to start the first run."
            className="py-2"
          />
          <Button className="mt-3" onClick={onRun}>
            <Play data-icon="inline-start" />
            Run now
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid content-start gap-2">
          {runs.map((run) => (
            <RunHistoryCard
              key={run.id}
              run={run}
              highlighted={run.id === highlightedRunId}
              onStop={() => onStop(run)}
              onOpenSession={() => onOpenSession(run)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RunHistoryCard({
  run,
  onStop,
  onOpenSession,
  highlighted = false,
}: {
  run: Run;
  onStop: () => void;
  onOpenSession: () => void;
  highlighted?: boolean;
}) {
  const [viewingOutput, setViewingOutput] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyOutput = async () => {
    await navigator.clipboard.writeText(run.output ?? "");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <article
      aria-current={highlighted ? "true" : undefined}
      className={`grid min-w-0 gap-3 rounded-xl border p-4 text-sm md:grid-cols-[minmax(0,1fr)_auto] ${highlighted ? "border-primary" : ""}`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className={`flex size-8 items-center justify-center rounded-full ${run.state === "failed" ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground"}`}
            aria-label={run.state}
          >
            {run.state === "failed" ? (
              "×"
            ) : (
              <Check className="size-4" aria-hidden="true" />
            )}
          </span>
          <strong className="text-base capitalize">{run.state}</strong>
          <span className="rounded-full bg-muted px-3 py-1 text-xs">
            {run.trigger}
          </span>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <time>{new Date(run.createdAt).toLocaleString()}</time>
            <span aria-hidden="true">•</span>
            {run.phase ? (
              run.phase === "send_to_log" ? (
                "Saved to Log"
              ) : (
                "Working"
              )
            ) : run.error ? (
              <span className="text-destructive">Failed</span>
            ) : (
              "Run complete"
            )}
          </div>
        </div>
        {(run.reason || run.error || run.output) && (
          <p
            className={`mt-3 line-clamp-2 text-sm ${run.error ? "text-muted-foreground" : "text-foreground"}`}
          >
            {run.reason ?? run.error ?? run.output}
          </p>
        )}
      </div>
      <div className="flex items-start gap-2 md:justify-end">
        {["pending", "running"].includes(run.state) && (
          <Button size="sm" variant="outline" onClick={onStop}>
            Stop
          </Button>
        )}
        {run.sessionId && (
          <Button size="sm" variant="outline" onClick={onOpenSession}>
            Open session
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="icon-sm" variant="ghost" aria-label="Run actions">
                <MoreVertical />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setViewingOutput(true)}
              disabled={!run.output}
            >
              <Eye data-icon="inline-start" /> View output
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Dialog open={viewingOutput} onOpenChange={setViewingOutput}>
        <DialogContent className="flex max-h-[85dvh] flex-col overflow-hidden sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Run output</DialogTitle>
            <DialogDescription>
              {new Date(run.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto rounded-lg border bg-muted/30 p-4">
            <MarkdownRenderer content={run.output || "*No output captured.*"} />
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={copyOutput}
              disabled={!run.output}
            >
              {copied ? (
                <Check data-icon="inline-start" />
              ) : (
                <Copy data-icon="inline-start" />
              )}
              {copied ? "Copied" : "Copy output"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}
