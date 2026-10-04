import { Streamdown } from "streamdown";
import type { AnimateOptions } from "streamdown";
import { code } from "@streamdown/code";
import { mermaid } from "@streamdown/mermaid";
import { math } from "@streamdown/math";
import { cjk } from "@streamdown/cjk";

const PLUGINS = { code, mermaid, math, cjk } as const;

export const streamingTextAnimation: AnimateOptions = {
  animation: "slideUp",
  duration: 180,
  easing: "ease-out",
  sep: "word",
};

interface MarkdownRendererProps {
  content: string;
  isAnimating?: boolean;
  animated?: boolean | AnimateOptions;
}

export function MarkdownRenderer({
  content,
  isAnimating = false,
  animated = false,
}: MarkdownRendererProps) {
  return (
    <Streamdown plugins={PLUGINS} isAnimating={isAnimating} animated={animated}>
      {content}
    </Streamdown>
  );
}
