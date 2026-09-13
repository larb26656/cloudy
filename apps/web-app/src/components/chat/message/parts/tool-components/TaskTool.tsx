import { Bot, ExternalLink, ListTodo } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { useSessionViewDialog } from "../../context";
import { ToolPreviewLabel } from "../ToolPreviewLabel";
import { ExpandableToolCard } from "./ExpandableToolCard";
import type { ToolComponentProps } from "./types";
import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";

function getSessionID(state: ToolPartType["state"]): string | undefined {
  if (state.status === "pending") return undefined;
  return state.metadata?.sessionId as string | undefined;
}

function TaskPreview({ state }: { state: ToolPartType["state"] }) {
  const { openSessionView } = useSessionViewDialog();
  const sessionID = getSessionID(state);
  if (!sessionID) return null;

  return (
    <ToolPreviewLabel
      icon={<ListTodo className="size-3" />}
      label={"Subtask"}
      action={
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => openSessionView(sessionID)}
        >
          <ExternalLink className="size-3.5" />
        </Button>
      }
    />
  );
}

export function TaskTool({ state }: ToolComponentProps) {
  const input = state.input;
  const agent = input?.agent as string | undefined;
  const description = input?.description as string | undefined;
  const prompt = input?.prompt as string | undefined;

  return (
    <ExpandableToolCard
      tool="task"
      state={state}
      preview={<TaskPreview state={state} />}
      detail={
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
      }
    />
  );
}
