import type { ReactNode } from "react";
import { Badge } from "@cloudy/ui";

interface ToolValueRendererProps {
  value: unknown;
  keyName: string;
}

export function ToolValueRenderer({ value, keyName }: ToolValueRendererProps) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">null</span>;
  }

  if (typeof value === "string") {
    if (keyName === "filePath" || keyName === "path" || keyName === "url") {
      return <code className="text-xs bg-muted px-1 rounded">{value}</code>;
    }
    if (keyName === "pattern" || keyName === "regex") {
      return (
        <code className="text-xs bg-purple-100 dark:bg-purple-900/50 px-1 rounded">
          {value}
        </code>
      );
    }
    if (keyName === "command" || keyName === "description") {
      return <code className="text-xs font-mono">{value}</code>;
    }
    if (value.length > 100) {
      return (
        <details className="text-xs">
          <summary className="cursor-pointer hover:underline">
            Show long content
          </summary>
          <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
            {value}
          </pre>
        </details>
      );
    }
    return <span className="text-xs">{value}</span>;
  }

  if (typeof value === "number") {
    return <span className="text-xs font-mono">{value}</span>;
  }

  if (typeof value === "boolean") {
    return (
      <Badge variant={value ? "default" : "secondary"} className="text-xs">
        {String(value)}
      </Badge>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-xs text-muted-foreground italic">[]</span>;
    }
    return (
      <div className="pl-2 border-l-2 border-muted-foreground/30">
        {value.map((item, idx) => (
          <div key={idx} className="text-xs py-0.5">
            {renderValue(item, "") as ReactNode}
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return (
        <span className="text-xs text-muted-foreground italic">{`{}`}</span>
      );
    }
    return (
      <div className="pl-2 border-l-2 border-muted-foreground/30">
        {entries.map(([k, v]) => (
          <div key={k} className="text-xs py-0.5">
            <span className="font-medium text-muted-foreground">{k}:</span>{" "}
            {renderValue(v, k) as ReactNode}
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-xs">{String(value)}</span>;
}

function renderValue(value: unknown, keyName: string): ReactNode {
  return <ToolValueRenderer value={value} keyName={keyName} />;
}
