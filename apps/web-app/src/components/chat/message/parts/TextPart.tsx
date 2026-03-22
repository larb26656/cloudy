import type { TextPart as TextPartType } from "@opencode-ai/sdk/v2";
import { MarkdownRenderer } from "../../../markdown/MarkdownRenderer";

interface TextPartProps {
  part: TextPartType;
}

export function TextPart({ part }: TextPartProps) {
  return (
    <div className="text-sm leading-relaxed">
      {part.synthetic && (
        <span className="text-xs text-muted-foreground italic mr-2">
          (synthetic)
        </span>
      )}
      {part.ignored && (
        <span className="text-xs text-muted-foreground line-through mr-2">
          (ignored)
        </span>
      )}
      <MarkdownRenderer content={part.text} />
    </div>
  );
}
