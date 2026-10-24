import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "@repo/ui/components/sonner";
import { Button } from "@repo/ui/components/button";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import { useState } from "react";
import {
  useCloudyAgents,
  useCreateCloudyAgent,
  useDeleteCloudyAgent,
  useUpdateCloudyAgent,
} from "@/hooks/queries/useCloudyAgents";
import { AgentAvatar } from "@/components/agent-avatar/AgentAvatar";
import { CloudyAgentDialog } from "./CloudyAgentDialog";
import type {
  CloudyAgent,
  CloudyAgentInput,
} from "@/hooks/queries/useCloudyAgents";

export function CloudyAgentSettings() {
  const query = useCloudyAgents();
  const create = useCreateCloudyAgent();
  const update = useUpdateCloudyAgent();
  const remove = useDeleteCloudyAgent();
  const [editing, setEditing] = useState<CloudyAgent | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<CloudyAgent | null>(null);

  const openDialog = (agent?: CloudyAgent) => {
    setEditing(agent ?? null);
    setOpen(true);
  };

  const submit = (input: CloudyAgentInput) => {
    if (editing) {
      update.mutate(
        { id: editing.id, ...input },
        {
          onSuccess: () => setOpen(false),
          onError: (error) => toast.error(error.message),
        },
      );
    } else {
      create.mutate(input, {
        onSuccess: () => setOpen(false),
        onError: (error) => toast.error(error.message),
      });
    }
  };

  if (query.isPending) return <LoadingState className="py-12" />;
  if (query.error)
    return (
      <ErrorState
        message={query.error.message}
        onRetry={() => void query.refetch()}
        className="py-12"
      />
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Cloudy Agents</h2>
          <p className="text-sm text-muted-foreground">
            Create agents with their own system prompts for Cloudy chats.
          </p>
        </div>
        <Button
          size="icon"
          variant="outline"
          aria-label="Create agent"
          onClick={() => openDialog()}
        >
          <Plus data-icon="inline-start" />
        </Button>
      </div>

      {query.data.agents.length ? (
        <div className="grid gap-3">
          {query.data.agents.map((agent) => (
            <div
              key={agent.id}
              className="flex items-start justify-between gap-4 rounded-lg border p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                {agent.avatar && (
                  <AgentAvatar {...agent.avatar} className="size-10 shrink-0" />
                )}
                <div className="min-w-0">
                  <h3 className="font-medium">{agent.name}</h3>
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                    {agent.systemPrompt || "No system prompt"}
                  </p>
                </div>
              </div>
              {!agent.builtIn && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Edit ${agent.name}`}
                    onClick={() => openDialog(agent)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Delete ${agent.name}`}
                    onClick={() => setDeleting(agent)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Cloudy agents yet"
          description="Create an agent to use a custom system prompt in chat."
          action={<Button onClick={() => openDialog()}>Create agent</Button>}
        />
      )}

      <CloudyAgentDialog
        agent={editing ?? undefined}
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setEditing(null);
        }}
        isSaving={create.isPending || update.isPending}
        onSubmit={submit}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeleting(null);
        }}
        title="Delete Cloudy agent?"
        description={
          deleting
            ? `“${deleting.name}” will be permanently deleted. This action cannot be undone.`
            : "This action cannot be undone."
        }
        confirmLabel="Delete agent"
        destructive
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onError: (error) => toast.error(error.message),
          });
        }}
      />
    </div>
  );
}
