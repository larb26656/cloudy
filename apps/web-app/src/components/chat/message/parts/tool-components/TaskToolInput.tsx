import { useState } from "react";
import { Bot, ExternalLink, ListTodo, Zap } from "lucide-react";
import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SessionViewDialog } from "@/components/chat/dialogs/SessionViewDialog";
import { ToolPreviewLabel } from "../ToolPreviewLabel";

interface TaskToolInputProps {
  state: ToolPartType["state"];
}

function getSessionID(state: ToolPartType["state"]): string | undefined {
  // TODO refactor later
  const data = state as any;
  return data?.metadata?.sessionId as string | undefined;
}

function getAgent(state: TaskToolInputProps["state"]): string | undefined {
  return state.input?.agent as string | undefined;
}

export function Preview({ state }: TaskToolInputProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const sessionID = getSessionID(state);
  const agent = getAgent(state);
  if (!sessionID) return null;

  return (
    <>
      <ToolPreviewLabel
        icon={<ListTodo className="size-3" />}
        // TODO add session title
        label={"Subtask"}
        action={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setDialogOpen(true)}
          >
            <ExternalLink className="size-3.5" />
          </Button>
        }
      />
      <SessionViewDialog
        sessionId={sessionID}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}

export function Detail({
  input,
}: {
  input: TaskToolInputProps["state"]["input"];
}) {
  const agent = input?.agent as string | undefined;
  const description = input?.description as string | undefined;
  const prompt = input?.prompt as string | undefined;

  return (
    <div className="space-y-2">
      {agent && (
        <div className="flex items-center gap-2">
          <Bot className="size-3 text-orange-600 dark:text-orange-400" />
          <span className="text-sm font-medium">{agent}</span>
        </div>
      )}
      {description && <p className="text-sm">{description}</p>}
      {prompt && (
        <pre className="text-xs font-mono bg-orange-100 dark:bg-orange-900/50 rounded p-2 overflow-x-auto">
          {prompt}
        </pre>
      )}
    </div>
  );
}
