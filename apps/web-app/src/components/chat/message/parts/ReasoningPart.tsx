import type { ReasoningPart as ReasoningPartType } from "@opencode-ai/sdk/v2";
import { Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { useChatSettingsStore } from "@/stores/chatSettingsStore";
import CollapsiblePart from "./CollapsiblePart";

interface ReasoningPartProps {
  part: ReasoningPartType;
}

export function ReasoningPart({ part }: ReasoningPartProps) {
  const autoExpandThinking = useChatSettingsStore(
    (s) => s.autoExpandThinking
  );
  const duration = part.time.end
    ? `${((part.time.end - part.time.start) / 1000).toFixed(2)}s`
    : null;

  const header = (
    <div className="flex items-center gap-2 mb-2">
      <Brain className="size-4 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">
        Reasoning
      </span>
      {duration && (
        <span className="text-xs text-muted-foreground">{duration}</span>
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
    <CollapsiblePart label="Thinking" detail={duration || ""}>
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
