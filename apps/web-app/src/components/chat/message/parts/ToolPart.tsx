import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";
import { Wrench } from "lucide-react";
import { Card, CardContent } from "@cloudy/ui";
import CollapsiblePart from "./CollapsiblePart";
import { ToolStateDisplay } from "./ToolStateDisplay";
import { Detail, Preview } from "./tool-components";

interface ToolPartProps {
  part: ToolPartType;
}

export function ToolPart({ part }: ToolPartProps) {
  const stateLabel =
    part.state.status === "pending"
      ? "Pending"
      : part.state.status === "running"
        ? "Running"
        : part.state.status === "completed"
          ? "Completed"
          : part.state.status === "error"
            ? "Error"
            : "";

  return (
    <div className="space-y-1">
      <CollapsiblePart
        label="Tool Call"
        detail={`${part.tool} - ${stateLabel}`}
      >
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wrench className="size-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Tool Call
                </span>
              </div>
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {part.tool}
              </div>
              <ToolStateDisplay state={part.state}>
                <Detail tool={part.tool} state={part.state} />
              </ToolStateDisplay>
            </div>
          </CardContent>
        </Card>
      </CollapsiblePart>
      <Preview tool={part.tool} state={part.state} />
    </div>
  );
}
