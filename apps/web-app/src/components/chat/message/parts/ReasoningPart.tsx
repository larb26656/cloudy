import type { ReasoningPart as ReasoningPartType } from "@opencode-ai/sdk/v2";
import { Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { useChatSettingsStore } from "@/stores/chatSettingsStore";
import { useElapsedTime } from "@/hooks/useElapsedTime";
import CollapsiblePart from "./CollapsiblePart";

interface ReasoningPartProps {
  part: ReasoningPartType;
}

export function ReasoningPart({ part }: ReasoningPartProps) {
  const autoExpandThinking = useChatSettingsStore((s) => s.autoExpandThinking);
  const isRunning = !part.time.end;
  const finalSeconds = part.time.end
    ? Math.round((part.time.end - part.time.start) / 1000)
    : null;
  const liveSeconds = useElapsedTime({
    start: part.time.start,
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
