import type { TextMessagePart } from "@repo/ai-core";
import {
  MarkdownRenderer,
  streamingTextAnimation,
} from "@repo/ui/components/markdown";

interface TextPartProps {
  part: TextMessagePart;
  isStreaming?: boolean;
}

export function TextPart({ part, isStreaming = false }: TextPartProps) {
  return (
    <div className="text-sm leading-relaxed">
      {part.metadata?.synthetic === true && (
        <span className="text-xs text-muted-foreground italic mr-2">
          (synthetic)
        </span>
      )}
      {part.metadata?.ignored === true && (
        <span className="text-xs text-muted-foreground line-through mr-2">
          (ignored)
        </span>
      )}
      <MarkdownRenderer
        content={part.text}
        isAnimating={isStreaming}
        animated={isStreaming ? streamingTextAnimation : false}
      />
    </div>
  );
}
