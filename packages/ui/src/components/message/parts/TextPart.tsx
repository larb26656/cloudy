import type { TextMessagePart } from "@repo/ai-core";
import { MarkdownRenderer } from "@repo/ui/components/markdown";

interface TextPartProps {
  part: TextMessagePart;
}

export function TextPart({ part }: TextPartProps) {
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
      <MarkdownRenderer content={part.text} />
    </div>
  );
}
