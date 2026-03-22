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
      <Card className="bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-rose-600 dark:text-rose-400" />
              <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
                Agent
              </span>
            </div>
            <div className="text-sm text-rose-900 dark:text-rose-100 font-medium">
              {part.name}
            </div>
            {part.source && (
              <div className="text-xs font-mono bg-rose-100 dark:bg-rose-900/50 rounded p-2 overflow-x-auto">
                <div className="flex items-center gap-1 text-rose-700 dark:text-rose-300 mb-1">
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
