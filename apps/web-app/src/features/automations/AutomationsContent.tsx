import { useEffect, useState } from "react";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import {
  useAutomationRuns,
  useAutomations,
  useCreateAutomation,
  useDeleteAutomation,
  useRunAutomation,
  useSchedulePreview,
  useStopAutomationRun,
  useUpdateAutomation,
} from "@/hooks/queries/useAutomations";
import type {
  Automation,
  AutomationInput,
  Run,
} from "@/hooks/queries/useAutomations";
import { AutomationFormDialog } from "./AutomationFormDialog";
import { useTabStore } from "@/stores/tabStore";
import { useAutomationNavigationStore } from "@/stores/automationNavigationStore";

const emptyAutomation: AutomationInput = {
  name: "",
  prompt: "",
  providerInstanceId: "",
  directoryMode: "temp",
};

export function AutomationsContent() {
  const { data: automations, isLoading, error } = useAutomations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{
    id: string | null;
    values: AutomationInput;
  } | null>(null);
  const selected = automations?.find((item) => item.id === selectedId) ?? null;
  const runsQuery = useAutomationRuns(selected?.id ?? null);
  const preview = useSchedulePreview(selected?.id ?? null);
  const create = useCreateAutomation();
  const update = useUpdateAutomation();
  const remove = useDeleteAutomation();
  const startRun = useRunAutomation();
  const stopRun = useStopAutomationRun();
  const addTab = useTabStore((state) => state.addTab);
  const consumeReturnTarget = useAutomationNavigationStore(
    (state) => state.consumeReturnTarget,
  );
  const setReturnTarget = useAutomationNavigationStore(
    (state) => state.setReturnTarget,
  );

  useEffect(() => {
    const target = consumeReturnTarget();
    if (target) {
      setSelectedId(target.automationId);
      setSelectedRunId(target.runId);
    }
  }, [consumeReturnTarget]);

  const save = (values: AutomationInput) => {
    const payload = { ...values };
    if (!payload.schedule?.cron) delete payload.schedule;
    if (editing?.id) {
      update.mutate(
        { id: editing.id, ...payload },
        { onSuccess: () => setEditing(null) },
      );
    } else {
      create.mutate(payload, {
        onSuccess: (automation) => {
          setSelectedId(automation.id);
          setEditing(null);
        },
      });
    }
  };

  let listContent;
  if (isLoading)
    listContent = <LoadingState size="inline" title="Loading automations..." />;
  else if (error)
    listContent = <ErrorState size="inline" bare message={error.message} />;
  else if (!automations?.length)
    listContent = (
      <EmptyState
        size="compact"
        title="No automations yet"
        description="Create one to run repeatable agent work."
      />
    );
  else
    listContent = automations.map((automation) => (
      <button
        key={automation.id}
        type="button"
        onClick={() => {
          setSelectedId(automation.id);
          setEditing(null);
        }}
        className={`w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-muted ${selectedId === automation.id ? "bg-muted" : "bg-background"}`}
      >
        <span className="block truncate font-medium">{automation.name}</span>
        <span className="text-xs text-muted-foreground">
          {automation.schedule?.enabled ? automation.schedule.cron : "Manual"}
        </span>
      </button>
    ));

  return (
    <main className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Automations
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Repeatable prompts, scheduled or on demand.
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedId(null);
              setEditing({ id: null, values: { ...emptyAutomation } });
            }}
          >
            New automation
          </Button>
        </header>
        <div className="grid min-h-0 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-2" aria-label="Automation list">
            {listContent}
          </aside>
          <section className="min-w-0 rounded-xl border bg-card p-5">
            {selected ? (
              <AutomationDetails
                automation={selected}
                runs={runsQuery.data ?? []}
                runsLoading={runsQuery.isLoading}
                runsError={runsQuery.error}
                occurrences={preview.data?.occurrences ?? []}
                highlightedRunId={selectedRunId}
                onEdit={() =>
                  setEditing({
                    id: selected.id,
                    values: {
                      name: selected.name,
                      prompt: selected.prompt,
                      providerInstanceId: selected.providerInstanceId,
                      directoryMode: selected.directoryMode,
                      ...(selected.agentId && { agentId: selected.agentId }),
                      ...(selected.model && { model: selected.model }),
                      ...(selected.directoryPath && {
                        directoryPath: selected.directoryPath,
                      }),
                      ...(selected.schedule && { schedule: selected.schedule }),
                    },
                  })
                }
                onRun={() => startRun.mutate(selected.id)}
                onDelete={() =>
                  remove.mutate(selected.id, {
                    onSuccess: () => setSelectedId(null),
                  })
                }
                onStop={(run) =>
                  stopRun.mutate({ id: selected.id, runId: run.id })
                }
                onOpenSession={(run) => {
                  if (!run.sessionId) return;
                  setReturnTarget({ automationId: selected.id, runId: run.id });
                  const config = run.configSnapshot as Partial<AutomationInput>;
                  addTab("chat", {
                    providerId:
                      config.providerInstanceId ?? selected.providerInstanceId,
                    sessionId: run.sessionId,
                    workspaceId: null,
                    directory: config.directoryPath ?? "",
                    sessionName: `${selected.name} · Run`,
                    agent: config.agentId ?? null,
                    model: null,
                  });
                }}
              />
            ) : (
              <EmptyState
                title="Select an automation"
                description="Choose an automation or create a new one."
              />
            )}
          </section>
        </div>
      </div>
      <AutomationFormDialog
        open={editing !== null}
        values={editing?.values ?? emptyAutomation}
        isEditing={editing?.id !== null && editing?.id !== undefined}
        saving={create.isPending || update.isPending}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSubmit={save}
      />
    </main>
  );
}

function AutomationDetails({
  automation,
  runs,
  runsLoading,
  runsError,
  occurrences,
  highlightedRunId,
  onEdit,
  onRun,
  onDelete,
  onStop,
  onOpenSession,
}: {
  automation: Automation;
  runs: Run[];
  runsLoading: boolean;
  runsError: Error | null;
  occurrences: string[];
  highlightedRunId: string | null;
  onEdit: () => void;
  onRun: () => void;
  onDelete: () => void;
  onStop: (run: Run) => void;
  onOpenSession: (run: Run) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{automation.name}</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
            {automation.prompt}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            Edit
          </Button>
          <Button onClick={onRun}>Run now</Button>
          <Button variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
      {automation.schedule && (
        <div className="rounded-lg border p-3 text-sm">
          <span className="font-medium">
            {automation.schedule.enabled ? "Scheduled" : "Schedule paused"}
          </span>
          <span className="ml-2 font-mono text-muted-foreground">
            {automation.schedule.cron}
          </span>
          <span className="ml-2 text-muted-foreground">
            {automation.schedule.timezone}
          </span>
          <ol
            aria-label="Next three occurrences"
            className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground"
          >
            {occurrences.map((date) => (
              <li key={date}>
                {new Date(date).toLocaleString(undefined, {
                  timeZone: automation.schedule!.timezone,
                })}
              </li>
            ))}
          </ol>
        </div>
      )}
      <section className="grid gap-2">
        <h3 className="text-sm font-semibold">Run history</h3>
        {runsLoading ? (
          <LoadingState size="inline" title="Loading runs..." />
        ) : runsError ? (
          <ErrorState size="inline" bare message={runsError.message} />
        ) : runs.length === 0 ? (
          <EmptyState
            size="compact"
            title="No runs yet"
            description="Run it now to start the first run."
          />
        ) : (
          runs.map((run) => (
            <RunRow
              key={run.id}
              run={run}
              highlighted={run.id === highlightedRunId}
              onStop={() => onStop(run)}
              onOpenSession={() => onOpenSession(run)}
            />
          ))
        )}
      </section>
    </div>
  );
}

function RunRow({
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
  return (
    <article
      aria-current={highlighted ? "true" : undefined}
      className={`grid gap-2 rounded-lg border p-3 text-sm md:grid-cols-[1fr_auto] ${highlighted ? "border-primary" : ""}`}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <strong className="capitalize">{run.state}</strong>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
            {run.trigger}
          </span>
          {run.phase && (
            <span className="text-xs text-muted-foreground">
              {run.phase === "send_to_log" ? "Saving to Log" : "Working"}
            </span>
          )}
          <time className="text-xs text-muted-foreground">
            {new Date(run.createdAt).toLocaleString()}
          </time>
        </div>
        {(run.reason || run.error) && (
          <p className="mt-1 text-sm text-destructive">
            {run.reason ?? run.error}
          </p>
        )}
        {run.output && (
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
            {run.output}
          </pre>
        )}
      </div>
      <div className="flex items-start gap-2">
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
      </div>
    </article>
  );
}
