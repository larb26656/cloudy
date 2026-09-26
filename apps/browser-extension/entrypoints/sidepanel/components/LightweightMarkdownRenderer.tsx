interface LightweightMarkdownRendererProps {
  content: string;
  isAnimating?: boolean;
}

interface CodeBlockProps {
  children: string;
  fileName?: string;
  showLineNumbers?: boolean;
}

interface DiffViewerProps {
  diff: string;
  title?: string;
  filePath: string;
}

export function MarkdownRenderer({
  content,
  isAnimating = false,
}: LightweightMarkdownRendererProps) {
  return (
    <div className="whitespace-pre-wrap">
      {content}
      {isAnimating && <span className="animate-pulse">|</span>}
    </div>
  );
}

export function CodeBlock({
  children,
  fileName,
  showLineNumbers = false,
}: CodeBlockProps) {
  const lines = children.split("\n");

  return (
    <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
      <code>
        {lines.map((line, index) => (
          <span key={index} className="block">
            {showLineNumbers && (
              <span className="select-none text-muted-foreground mr-4">
                {index + 1}
              </span>
            )}
            {line}
          </span>
        ))}
      </code>
      {fileName && (
        <span className="text-xs text-muted-foreground">{fileName}</span>
      )}
    </pre>
  );
}

export function DiffViewer({ diff, title, filePath }: DiffViewerProps) {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="border-b px-3 py-2 text-xs text-muted-foreground">
        {title || filePath}
      </div>
      <pre className="overflow-x-auto p-3 text-sm font-mono leading-relaxed">
        <code>{diff}</code>
      </pre>
    </div>
  );
}
