import { MarkdownRenderer } from "@repo/ui/components/markdown";

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
