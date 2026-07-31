import type { ReactNode } from "react";
import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";
import { Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CollapsiblePart from "../CollapsiblePart";
import { ToolStateDisplay } from "../ToolStateDisplay";

interface ExpandableToolCardProps {
  tool: string;
  state: ToolPartType["state"];
  preview?: ReactNode;
  detail?: ReactNode;
}

function getStateLabel(status: ToolPartType["state"]["status"]): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "running":
      return "Running";
    case "completed":
      return "Completed";
    case "error":
      return "Error";
    default:
      return "";
  }
}

export function ExpandableToolCard({
  tool,
  state,
  preview,
  detail,
}: ExpandableToolCardProps) {
  return (
    <div className="space-y-1">
      {detail && (
        <CollapsiblePart label="Tool Call" detail={`${tool} - ${getStateLabel(state.status)}`}>
          <Card>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wrench className="size-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Tool Call
                  </span>
                </div>
                <div className="text-sm font-medium">{tool}</div>
                <ToolStateDisplay state={state}>{detail}</ToolStateDisplay>
              </div>
            </CardContent>
          </Card>
        </CollapsiblePart>
      )}
      {preview}
    </div>
  );
}
