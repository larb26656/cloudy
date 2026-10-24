import { useState } from "react";
import type { FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "@repo/ui/components/sonner";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import {
  useCloudyAgents,
  useCreateCloudyAgent,
  useDeleteCloudyAgent,
  useUpdateCloudyAgent,
} from "@/hooks/queries/useCloudyAgents";
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
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");

  const openDialog = (agent?: CloudyAgent) => {
    setEditing(agent ?? null);
    setName(agent?.name ?? "");
    setSystemPrompt(agent?.systemPrompt ?? "");
    setOpen(true);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: CloudyAgentInput = { name: name.trim(), systemPrompt };
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
              <div className="min-w-0">
                <h3 className="font-medium">{agent.name}</h3>
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {agent.systemPrompt || "No system prompt"}
                </p>
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
                    onClick={() =>
                      remove.mutate(agent.id, {
                        onError: (error) => toast.error(error.message),
                      })
                    }
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit agent" : "Create agent"}</DialogTitle>
            <DialogDescription>
              Set the name and system prompt for this Cloudy agent.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Name
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={100}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              System prompt
              <Textarea
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                rows={8}
              />
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={create.isPending || update.isPending}
              >
                {editing ? "Save changes" : "Create agent"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
