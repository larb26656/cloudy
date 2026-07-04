import type { AgentPart as AgentPartType } from "@opencode-ai/sdk/v2";
import { Bot, Code } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CollapsiblePart from "./CollapsiblePart";

interface AgentPartProps {
  part: AgentPartType;
}

export function AgentPart({ part }: AgentPartProps) {
  return (
    <CollapsiblePart label="Agent" detail={part.name}>
      <Card>
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Agent
              </span>
            </div>
            <div className="text-sm font-medium">
              {part.name}
            </div>
            {part.source && (
              <div className="text-xs font-mono bg-muted rounded p-2 overflow-x-auto">
                <div className="flex items-center gap-1 mb-1">
                  <Code className="size-3" />
                  <span>Source:</span>
                </div>
                <div className="truncate">
                  {part.source.value.slice(part.source.start, part.source.end)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </CollapsiblePart>
  );
}
