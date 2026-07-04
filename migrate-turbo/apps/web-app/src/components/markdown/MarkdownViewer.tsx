import { MarkdownRenderer } from "./MarkdownRenderer";

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  return (
    <div className={className}>
      <MarkdownRenderer content={content || "*No content*"} />
    </div>
  );
}
