import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Clock3,
  FileText,
  Globe2,
  Mail,
  Megaphone,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  Radar,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { Input } from "@repo/ui/components/input";
import { LoadingState } from "@repo/ui/components/loading-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
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
  const [automationToDelete, setAutomationToDelete] =
    useState<Automation | null>(null);
  const [search, setSearch] = useState("");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{
    id: string | null;
    values: AutomationInput;
  } | null>(null);
  const [creating, setCreating] = useState(false);
  const selected = automations?.find((item) => item.id === selectedId) ?? null;
  const filteredAutomations = useMemo(
    () =>
      automations?.filter((automation) =>
        automation.name.toLowerCase().includes(search.trim().toLowerCase()),
      ) ?? [],
    [automations, search],
  );
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
    } else if (!selectedId && !creating && automations?.length) {
      setSelectedId(automations[0]?.id ?? null);
    }
  }, [automations, consumeReturnTarget, creating, selectedId]);

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
  else if (!filteredAutomations.length)
    listContent = (
      <EmptyState
        size="compact"
        title="No matching automations"
        description="Try another search term."
      />
    );
  else
    listContent = filteredAutomations.map((automation, index) => {
      const Icon = automationIcon(index);

      return (
        <div
          key={automation.id}
          className={`group flex items-center gap-3 rounded-lg border px-3 py-3 transition-colors ${selectedId === automation.id ? "border-primary/40 bg-primary/5" : "border-transparent hover:border-border hover:bg-muted/60"}`}
        >
          <button
            type="button"
            onClick={() => {
              setSelectedId(automation.id);
              setEditing(null);
            }}
            aria-current={selectedId === automation.id ? "true" : undefined}
            className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {automation.name}
              </span>
              <span className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
                {automation.schedule?.enabled
                  ? automation.schedule.cron
                  : "Manual"}
              </span>
            </span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Automation item actions"
                  className="size-8 shrink-0 text-muted-foreground"
                />
              }
            >
              <MoreVertical aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedId(automation.id);
                  setEditing({
                    id: automation.id,
                    values: {
                      name: automation.name,
                      prompt: automation.prompt,
                      providerInstanceId: automation.providerInstanceId,
                      directoryMode: automation.directoryMode,
                      ...(automation.agentId && {
                        agentId: automation.agentId,
                      }),
                      ...(automation.model && { model: automation.model }),
                      ...(automation.directoryPath && {
                        directoryPath: automation.directoryPath,
                      }),
                      ...(automation.schedule && {
                        schedule: automation.schedule,
                      }),
                    },
                  });
                }}
              >
                <Pencil data-icon="inline-start" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setAutomationToDelete(automation)}
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    });

  return (
    <main className="h-full overflow-hidden p-4 md:p-5">
      <div className="mx-auto grid h-full max-w-[1600px] min-h-0 grid-rows-[minmax(220px,0.8fr)_minmax(0,1fr)] gap-4 lg:grid-rows-1 lg:grid-cols-[minmax(280px,0.38fr)_minmax(0,1fr)] xl:gap-5">
        <aside
          className="flex min-h-0 flex-col gap-4 overflow-hidden rounded-xl border bg-card p-4 md:p-5"
          aria-label="Automation list"
        >
          <header>
            <h1 className="text-2xl font-semibold tracking-tight">
              Automations
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Repeatable prompts, scheduled or on demand.
            </p>
          </header>
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search automations..."
              className="pl-9"
              aria-label="Search automations"
            />
          </label>
          <Button
            className="w-full"
            aria-label="New automation"
            onClick={() => {
              setSelectedId(null);
              setCreating(true);
              setEditing({ id: null, values: { ...emptyAutomation } });
            }}
          >
            <Plus data-icon="inline-start" />
            Create automation
          </Button>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-1" role="list">
              {listContent}
            </div>
          </div>
        </aside>
        <section className="min-h-0 min-w-0 overflow-y-auto rounded-xl border bg-card p-4 md:p-6">
          {selected ? (
            editing?.id === selected.id ? (
              <AutomationFormDialog
                inline
                open
                values={editing.values}
                isEditing
                saving={update.isPending}
                onOpenChange={(open) => {
                  if (!open) setEditing(null);
                }}
                onSubmit={save}
              />
            ) : (
              <AutomationDetails
                automation={selected}
                runs={runsQuery.data ?? []}
                runsLoading={runsQuery.isLoading}
                runsError={runsQuery.error}
                occurrences={preview.data?.occurrences ?? []}
                highlightedRunId={selectedRunId}
                onEdit={() => {
                  setCreating(false);
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
                      ...(selected.schedule && {
                        schedule: selected.schedule,
                      }),
                    },
                  });
                }}
                onRun={() => startRun.mutate(selected.id)}
                onDelete={() => setAutomationToDelete(selected)}
                onStop={(run) =>
                  stopRun.mutate({ id: selected.id, runId: run.id })
                }
                onOpenSession={(run) => {
                  if (!run.sessionId) return;
                  setReturnTarget({
                    automationId: selected.id,
                    runId: run.id,
                  });
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
            )
          ) : (
            <EmptyState
              title="Select an automation"
              description="Choose an automation or create a new one."
            />
          )}
        </section>
      </div>
      <AutomationFormDialog
        open={creating && editing !== null}
        values={editing?.values ?? emptyAutomation}
        isEditing={false}
        saving={create.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
        onSubmit={save}
      />
      <ConfirmDialog
        open={automationToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setAutomationToDelete(null);
        }}
        title="Delete automation?"
        description={`Delete "${automationToDelete?.name ?? ""}" permanently? This action cannot be undone.`}
        confirmLabel="Delete automation"
        destructive
        onConfirm={() => {
          if (!automationToDelete) return;
          remove.mutate(automationToDelete.id, {
            onSuccess: () => {
              if (selectedId === automationToDelete.id) setSelectedId(null);
              setAutomationToDelete(null);
            },
          });
        }}
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
      <header className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Radar className="size-8" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {automation.name}
            </h2>
            <p className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-muted-foreground md:text-base">
              {automation.prompt}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Automation actions"
                >
                  <MoreVertical />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 data-icon="inline-start" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Pencil data-icon="inline-start" />
            Edit
          </Button>
          <Button onClick={onRun}>
            <Play data-icon="inline-start" />
            Run now
          </Button>
        </div>
      </header>
      {automation.schedule ? (
        <section
          className="grid gap-4 rounded-xl border p-4 md:p-5"
          aria-label="Schedule"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-3 text-lg font-semibold">
              <CalendarDays aria-hidden="true" />
              Schedule
            </h3>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil data-icon="inline-start" />
              Edit
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <RefreshCw className="size-4" aria-hidden="true" />
              {automation.schedule.enabled
                ? automation.schedule.cron
                : "Schedule paused"}
            </span>
            <span className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
              <Globe2 className="size-4" aria-hidden="true" />
              {automation.schedule.timezone}
            </span>
          </div>
          {occurrences.length > 0 && (
            <div className="grid gap-3 border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                Next {occurrences.length} runs
              </h4>
              <ol
                aria-label="Next three occurrences"
                className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
              >
                {occurrences.map((date, index) => (
                  <li
                    key={date}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${index === 0 ? "border-primary/50 bg-primary/5" : ""}`}
                  >
                    <CalendarDays
                      className={`size-5 shrink-0 ${index === 0 ? "text-primary" : "text-muted-foreground"}`}
                      aria-hidden="true"
                    />
                    <div className="grid min-w-0">
                      <time dateTime={date}>
                        {new Date(date).toLocaleString(undefined, {
                          timeZone: automation.schedule!.timezone,
                          dateStyle: "medium",
                        })}
                      </time>
                      <span className="text-muted-foreground">
                        {new Date(date).toLocaleString(undefined, {
                          timeZone: automation.schedule!.timezone,
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      ) : (
        <section className="flex items-center gap-3 rounded-xl border p-4 text-sm text-muted-foreground">
          <CalendarDays aria-hidden="true" />
          This automation runs on demand.
        </section>
      )}
      <section className="flex min-h-[280px] flex-col rounded-xl border p-4 md:min-h-[340px] md:p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-3 text-lg font-semibold">
            <FileText aria-hidden="true" />
            Run history
          </h3>
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
              <RunRow
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

function automationIcon(index: number) {
  const icons = [
    Radar,
    FileText,
    ChartNoAxesColumnIncreasing,
    Shield,
    Mail,
    Megaphone,
    Activity,
    TrendingUp,
  ];

  return icons[index % icons.length]!;
}
