import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";
import {
  Wrench,
  Loader2,
  CheckCircle,
  XCircle,
  Terminal,
  FileText,
  Globe,
  MessageSquare,
  PlayCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

interface ToolPartProps {
  part: ToolPartType;
}

interface ToolStateDisplayProps {
  state: ToolPartType["state"];
}

interface ToolInputDisplayProps {
  tool: string;
  input: Record<string, unknown>;
}

function ToolInputDisplay({ tool, input }: ToolInputDisplayProps) {
  if (!input || Object.keys(input).length === 0) {
    return null;
  }

  const renderValue = (value: unknown, key: string): ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>;
    }

    if (typeof value === "string") {
      if (key === "filePath" || key === "path" || key === "url") {
        return <code className="text-xs bg-muted px-1 rounded">{value}</code>;
      }
      if (key === "pattern" || key === "regex") {
        return (
          <code className="text-xs bg-purple-100 dark:bg-purple-900/50 px-1 rounded">
            {value}
          </code>
        );
      }
      if (key === "command" || key === "description") {
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
  };

  if (tool === "bash") {
    return (
      <div className="space-y-2 mt-2 p-2 bg-slate-100 dark:bg-slate-800/50 rounded-md">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
          <Terminal className="size-3" />
          <span>Command</span>
        </div>
        <pre className="text-xs font-mono bg-slate-950 dark:bg-slate-950 text-slate-50 p-2 rounded overflow-x-auto">
          {String(input.command)}
        </pre>
        {input.description != null && (
          <div className="text-xs text-muted-foreground" key="description">
            <span className="font-medium">Description:</span>{" "}
            {String(input.description)}
          </div>
        )}
        {input.workdir != null && (
          <div className="text-xs text-muted-foreground" key="workdir">
            <span className="font-medium">Directory:</span>{" "}
            <code className="bg-muted px-1 rounded">
              {String(input.workdir)}
            </code>
          </div>
        )}
        {(input.timeout != null || input.env != null) && (
          <details className="text-xs">
            <summary className="cursor-pointer hover:underline text-muted-foreground">
              Show options
            </summary>
            <div className="mt-1 pl-2 border-l-2 border-muted-foreground/30">
              {input.timeout != null && (
                <div className="py-0.5" key="timeout">
                  <span className="font-medium text-muted-foreground">
                    timeout:
                  </span>{" "}
                  {renderValue(input.timeout, "timeout") as ReactNode}
                </div>
              )}
              {input.env != null && (
                <div className="py-0.5" key="env">
                  <span className="font-medium text-muted-foreground">
                    env:
                  </span>{" "}
                  {renderValue(input.env, "env") as ReactNode}
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    );
  }

  if (tool === "read") {
    return (
      <div className="space-y-1.5 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
          <FileText className="size-3" />
          <span>File</span>
        </div>
        {input.filePath != null && (
          <div className="text-xs" key="filePath">
            <span className="text-muted-foreground">path:</span>{" "}
            <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">
              {String(input.filePath)}
            </code>
          </div>
        )}
        {(input.offset != null || input.limit != null) && (
          <div className="flex gap-2 text-xs" key="offset-limit">
            {input.offset != null && (
              <span>
                <span className="text-muted-foreground">offset:</span>{" "}
                {renderValue(input.offset, "offset") as ReactNode}
              </span>
            )}
            {input.limit != null && (
              <span>
                <span className="text-muted-foreground">limit:</span>{" "}
                {renderValue(input.limit, "limit") as ReactNode}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  if (tool === "write") {
    return (
      <div className="space-y-1.5 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
          <FileText className="size-3" />
          <span>Write</span>
        </div>
        {input.filePath != null && (
          <div className="text-xs" key="filePath">
            <span className="text-muted-foreground">path:</span>{" "}
            <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">
              {String(input.filePath)}
            </code>
          </div>
        )}
        {input.content != null && typeof input.content === "string" && (
          <details className="text-xs">
            <summary className="cursor-pointer hover:underline text-muted-foreground">
              Show content
            </summary>
            <pre className="mt-1 text-xs bg-slate-950 dark:bg-slate-950 text-slate-50 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
              {input.content.length > 500
                ? input.content.substring(0, 500) + "..."
                : input.content}
            </pre>
          </details>
        )}
      </div>
    );
  }

  if (tool === "edit") {
    return (
      <div className="space-y-1.5 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
          <FileText className="size-3" />
          <span>Edit</span>
        </div>
        {input.filePath != null && (
          <div className="text-xs" key="filePath">
            <span className="text-muted-foreground">path:</span>{" "}
            <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">
              {String(input.filePath)}
            </code>
          </div>
        )}
        {input.oldString != null && typeof input.oldString === "string" && (
          <div className="text-xs" key="oldString">
            <span className="text-muted-foreground">old:</span>
            <pre className="mt-1 text-xs bg-red-100 dark:bg-red-900/30 p-1 rounded line-through overflow-x-auto">
              {input.oldString.length > 100
                ? input.oldString.substring(0, 100) + "..."
                : input.oldString}
            </pre>
          </div>
        )}
        {input.newString != null && typeof input.newString === "string" && (
          <div className="text-xs">
            <span className="text-muted-foreground">new:</span>
            <pre className="mt-1 text-xs bg-green-100 dark:bg-green-900/30 p-1 rounded overflow-x-auto">
              {input.newString.length > 100
                ? input.newString.substring(0, 100) + "..."
                : input.newString}
            </pre>
          </div>
        )}
      </div>
    );
  }

  if (tool === "grep") {
    return (
      <div className="space-y-1.5 mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
        <div className="flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-300">
          <MessageSquare className="size-3" />
          <span>Search</span>
        </div>
        {input.pattern != null && (
          <div className="text-xs" key="pattern">
            <span className="text-muted-foreground">pattern:</span>{" "}
            <code className="bg-purple-100 dark:bg-purple-900/50 px-1 rounded font-mono">
              {String(input.pattern)}
            </code>
          </div>
        )}
        {input.path != null && (
          <div className="text-xs" key="path">
            <span className="text-muted-foreground">path:</span>{" "}
            <code className="bg-purple-100 dark:bg-purple-900/50 px-1 rounded">
              {String(input.path)}
            </code>
          </div>
        )}
        {input.include != null && (
          <div className="text-xs" key="include">
            <span className="text-muted-foreground">include:</span>{" "}
            {renderValue(input.include, "include") as ReactNode}
          </div>
        )}
      </div>
    );
  }

  if (tool === "glob") {
    return (
      <div className="space-y-1.5 mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
        <div className="flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-300">
          <MessageSquare className="size-3" />
          <span>Pattern</span>
        </div>
        {input.pattern != null && (
          <div className="text-xs" key="pattern">
            <span className="text-muted-foreground">pattern:</span>{" "}
            <code className="bg-purple-100 dark:bg-purple-900/50 px-1 rounded">
              {String(input.pattern)}
            </code>
          </div>
        )}
        {input.path != null && (
          <div className="text-xs" key="path">
            <span className="text-muted-foreground">path:</span>{" "}
            <code className="bg-purple-100 dark:bg-purple-900/50 px-1 rounded">
              {String(input.path)}
            </code>
          </div>
        )}
      </div>
    );
  }

  if (tool === "webfetch" || tool === "websearch") {
    return (
      <div className="space-y-1.5 mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md">
        <div className="flex items-center gap-1.5 text-xs font-medium text-orange-700 dark:text-orange-300">
          <Globe className="size-3" />
          <span>{tool === "webfetch" ? "Fetch" : "Search"}</span>
        </div>
        {input.url != null && (
          <div className="text-xs" key="url">
            <span className="text-muted-foreground">url:</span>{" "}
            <code className="bg-orange-100 dark:bg-orange-900/50 px-1 rounded break-all">
              {String(input.url)}
            </code>
          </div>
        )}
        {input.query != null && (
          <div className="text-xs" key="query">
            <span className="text-muted-foreground">query:</span>{" "}
            <span className="bg-orange-100 dark:bg-orange-900/50 px-1 rounded">
              {renderValue(input.query, "query") as ReactNode}
            </span>
          </div>
        )}
        {input.format != null && (
          <div className="text-xs" key="format">
            <span className="text-muted-foreground">format:</span>{" "}
            {renderValue(input.format, "format") as ReactNode}
          </div>
        )}
        {input.timeout != null && (
          <div className="text-xs" key="timeout">
            <span className="text-muted-foreground">timeout:</span>{" "}
            {renderValue(input.timeout, "timeout") as ReactNode}
          </div>
        )}
      </div>
    );
  }

  if (tool === "question") {
    const questions = input.questions as
      | Array<{
          question: string;
          header?: string;
          options?: Array<{ label: string; description: string }>;
        }>
      | undefined;
    return (
      <div className="space-y-1.5 mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md">
        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
          <MessageSquare className="size-3" />
          <span>Question</span>
        </div>
        {questions && questions.length > 0 ? (
          <div className="space-y-1">
            {questions.map((q, idx) => (
              <div key={idx} className="text-xs">
                <div className="font-medium">{q.question}</div>
                {q.header && (
                  <div className="text-muted-foreground text-[10px] uppercase">
                    {q.header}
                  </div>
                )}
                {q.options && q.options.length > 0 && (
                  <div className="mt-1 pl-2 border-l-2 border-amber-300 dark:border-amber-700">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="py-0.5">
                        <span className="font-medium">•</span>{" "}
                        <span>{opt.label}</span>
                        {opt.description && (
                          <span className="text-muted-foreground">
                            {" "}
                            - {opt.description}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs">
            {Object.entries(input).map(([key, value]) => (
              <div key={key} className="py-0.5">
                <span className="font-medium text-muted-foreground">
                  {key}:
                </span>{" "}
                {renderValue(value, key) as ReactNode}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (tool === "skill") {
    return (
      <div className="space-y-1.5 mt-2 p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-md">
        <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-700 dark:text-cyan-300">
          <PlayCircle className="size-3" />
          <span>Skill</span>
        </div>
        {input.name != null && (
          <div className="text-xs" key="name">
            <span className="text-muted-foreground">name:</span>{" "}
            <code className="bg-cyan-100 dark:bg-cyan-900/50 px-1 rounded">
              {String(input.name)}
            </code>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 mt-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-md">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
        <Wrench className="size-3" />
        <span>Parameters</span>
      </div>
      <div className="text-xs space-y-0.5">
        {Object.entries(input).map(([key, value]) => (
          <div key={key} className="py-0.5">
            <span className="font-medium text-muted-foreground">{key}:</span>{" "}
            {renderValue(value, key) as ReactNode}
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolStateDisplay({
  state,
  tool,
}: ToolStateDisplayProps & { tool: string }) {
  if (state.status === "pending") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Loader2 className="size-3 text-blue-600 dark:text-blue-400 animate-pulse" />
          <span className="text-xs text-blue-700 dark:text-blue-300">
            Pending
          </span>
        </div>
        <ToolInputDisplay tool={tool} input={state.input} />
      </div>
    );
  }

  if (state.status === "running") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Loader2 className="size-3 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="text-xs text-blue-700 dark:text-blue-300">
            Running
          </span>
          {state.title && (
            <span className="text-xs text-blue-900 dark:text-blue-100">
              {state.title}
            </span>
          )}
        </div>
        <ToolInputDisplay tool={tool} input={state.input} />
      </div>
    );
  }

  if (state.status === "completed") {
    const duration = state.time.end
      ? `${((state.time.end - state.time.start) / 1000).toFixed(2)}s`
      : null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="size-3 text-green-600 dark:text-green-400" />
          <span className="text-xs text-green-700 dark:text-green-300">
            Completed
          </span>
          {duration && (
            <span className="text-xs text-muted-foreground">({duration})</span>
          )}
        </div>
        {state.title && (
          <div className="text-sm text-green-900 dark:text-green-100 font-medium">
            {state.title}
          </div>
        )}
        <ToolInputDisplay tool={tool} input={state.input} />
        {state.output && (
          <div className="text-xs font-mono bg-green-100 dark:bg-green-900/50 rounded p-2 overflow-x-auto">
            {state.output}
          </div>
        )}
        {state.attachments && state.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {state.attachments.map((file) => (
              <Badge key={file.id} variant="secondary" className="text-xs">
                {file.filename || file.url}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (state.status === "error") {
    const duration = state.time.end
      ? `${((state.time.end - state.time.start) / 1000).toFixed(2)}s`
      : null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <XCircle className="size-3 text-red-600 dark:text-red-400" />
          <span className="text-xs text-red-700 dark:text-red-300">Error</span>
          {duration && (
            <span className="text-xs text-muted-foreground">({duration})</span>
          )}
        </div>
        <ToolInputDisplay tool={tool} input={state.input} />
        <div className="text-xs text-red-900 dark:text-red-100 bg-red-100 dark:bg-red-900/50 rounded p-2">
          {state.error}
        </div>
      </div>
    );
  }

  return null;
}

export function ToolPart({ part }: ToolPartProps) {
  return (
    <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Wrench className="size-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Tool Call
            </span>
          </div>
          <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {part.tool}
          </div>
          <ToolStateDisplay state={part.state} tool={part.tool} />
        </div>
      </CardContent>
    </Card>
  );
}
