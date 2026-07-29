import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { mermaid } from "@streamdown/mermaid";
import { math } from "@streamdown/math";
import { cjk } from "@streamdown/cjk";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <Streamdown
      plugins={{ code, mermaid, math, cjk }}
      isAnimating={status === "streaming"}
    >
      {content}
    </Streamdown>
  );
}
