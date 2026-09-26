import type { ReasoningMessagePart } from "@repo/ai-core";
import { Brain } from "lucide-react";
import { Card, CardContent } from "@repo/ui/components/card";
import { MarkdownRenderer } from "@repo/ui/components/markdown";
import { useMessageSettings } from "../context";
import { useElapsedTime } from "@repo/ui/hooks/use-elapsed-time";
import { CollapsiblePart } from "./CollapsiblePart";

interface ReasoningPartProps {
  part: ReasoningMessagePart;
}

export function ReasoningPart({ part }: ReasoningPartProps) {
  const { autoExpandThinking } = useMessageSettings();
  const isRunning = part.completedAt === undefined;
  const finalSeconds =
    part.completedAt && part.startedAt
      ? Math.round((part.completedAt - part.startedAt) / 1000)
      : null;
  const liveSeconds = useElapsedTime({
    start: part.startedAt ?? Date.now(),
    active: isRunning,
  });
  const label = isRunning
    ? `Thinking ${liveSeconds}s`
    : `Thought for ${finalSeconds}s`;

  const header = (
    <div className="flex items-center gap-2 mb-2">
      <Brain className="size-4 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">
        Reasoning
      </span>
      {finalSeconds !== null && (
        <span className="text-xs text-muted-foreground">{finalSeconds}s</span>
      )}
    </div>
  );

  if (autoExpandThinking) {
    return (
      <div className="opacity-60 border-l-2 border-border pl-3">
        {header}
        <div className="text-sm leading-relaxed">
          <MarkdownRenderer content={part.text} />
        </div>
      </div>
    );
  }

  return (
    <CollapsiblePart label={label} running={isRunning}>
      <Card>
        <CardContent>
          {header}
          <div className="text-sm font-mono leading-relaxed whitespace-pre-wrap">
            {part.text}
          </div>
        </CardContent>
      </Card>
    </CollapsiblePart>
  );
}
