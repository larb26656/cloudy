import { Streamdown } from "streamdown";
import type { AnimateOptions } from "streamdown";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { cjk } from "@streamdown/cjk";
import { PeleMermaidRenderer } from "./PeleMermaidRenderer";

const PLUGINS = {
  code,
  math,
  cjk,
  renderers: [{ language: "mermaid", component: PeleMermaidRenderer }],
};

export const streamingTextAnimation: AnimateOptions = {
  animation: "blurIn",
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
