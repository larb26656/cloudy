import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@repo/ui/components/button";
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
  AgentAvatar,
  agentAvatarAmbient,
  agentAvatarColors,
  agentAvatarEyes,
  agentAvatarFaceDecorations,
  agentAvatarFacewear,
  agentAvatarHeadwear,
  agentAvatarShapes,
  defaultAgentAvatar,
} from "@/components/agent-avatar/AgentAvatar";
import { AgentAvatarBuilder } from "@/components/agent-avatar/AgentAvatarBuilder";
import type { AgentAvatarRecipe } from "@/components/agent-avatar/AgentAvatar";
import type {
  CloudyAgent,
  CloudyAgentInput,
} from "@/hooks/queries/useCloudyAgents";

type Props = {
  agent?: CloudyAgent;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CloudyAgentInput) => void;
  open: boolean;
};

function randomOption<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)]!;
}

function createRandomAvatar(): AgentAvatarRecipe {
  return {
    shape: randomOption(agentAvatarShapes),
    color: randomOption(
      Object.keys(agentAvatarColors) as AgentAvatarRecipe["color"][],
    ),
    eyes: randomOption(agentAvatarEyes),
    headwear: randomOption(agentAvatarHeadwear),
    facewear: randomOption(agentAvatarFacewear),
    faceDecoration: randomOption(agentAvatarFaceDecorations),
    ambient: randomOption(agentAvatarAmbient),
  };
}

export function CloudyAgentDialog({
  agent,
  isSaving,
  onOpenChange,
  onSubmit,
  open,
}: Props) {
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [avatar, setAvatar] = useState<AgentAvatarRecipe>(defaultAgentAvatar);
  const isEditing = Boolean(agent);

  useEffect(() => {
    if (!open) {
      setAvatarEditorOpen(false);
      return;
    }
    setName(agent?.name ?? "");
    setSystemPrompt(agent?.systemPrompt ?? "");
    setAvatar(
      agent ? (agent.avatar ?? defaultAgentAvatar) : createRandomAvatar(),
    );
  }, [agent, open]);

  const avatarKey = [
    avatar.shape,
    avatar.color,
    avatar.eyes,
    avatar.headwear,
    avatar.facewear,
    avatar.faceDecoration,
    avatar.ambient,
  ].join("-");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ name: name.trim(), systemPrompt, avatar });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit agent" : "Create agent"}</DialogTitle>
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
          <section className="space-y-2" aria-labelledby="agent-avatar-title">
            <div>
              <h3 id="agent-avatar-title" className="text-sm font-medium">
                Avatar
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose how this agent appears in Cloudy.
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <AgentAvatar {...avatar} className="size-12 shrink-0" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAvatarEditorOpen(true)}
              >
                Edit avatar
              </Button>
            </div>
          </section>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isEditing ? "Save changes" : "Create agent"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <Dialog open={avatarEditorOpen} onOpenChange={setAvatarEditorOpen}>
        <DialogContent className="h-[calc(100dvh-2rem)] max-h-[44rem] max-w-[calc(100%-2rem)] overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Edit avatar</DialogTitle>
            <DialogDescription>
              Select the appearance for this Cloudy agent.
            </DialogDescription>
          </DialogHeader>
          <AgentAvatarBuilder
            key={avatarKey}
            className="h-full max-h-none max-w-none rounded-none border-0"
            defaultValues={avatar}
            submitLabel="Use avatar"
            onSubmit={(recipe) => {
              setAvatar(recipe);
              setAvatarEditorOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
