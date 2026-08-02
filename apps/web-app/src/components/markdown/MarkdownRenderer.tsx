import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { mermaid } from "@streamdown/mermaid";
import { math } from "@streamdown/math";
import { cjk } from "@streamdown/cjk";

interface MarkdownRendererProps {
  content: string;
  isAnimating?: boolean;
}

export function MarkdownRenderer({
  content,
  isAnimating = false,
}: MarkdownRendererProps) {
  return (
    <Streamdown plugins={{ code, mermaid, math, cjk }} isAnimating={isAnimating}>
      {content}
    </Streamdown>
  );
}
