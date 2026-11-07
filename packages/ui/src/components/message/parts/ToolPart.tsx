import type { ToolMessagePart } from "@repo/ai-core";
import { createTwoFilesPatch } from "diff";
import { DiffViewer } from "@repo/ui/components/markdown";
import { getToolComponent } from "./tool-components/registry";
import { ToolValueRenderer } from "./tool-components/ToolValueRenderer";

interface ToolPartProps {
  part: ToolMessagePart;
}

export function ToolPart({ part }: ToolPartProps) {
  const rawMetadata = part.metadata?.acp;
  const partial = !part.toolName || !part.status;
  const patchText = part.toolName === "apply_patch" && typeof part.input === "object" && part.input !== null
    ? (part.input as Record<string, unknown>).patchText
    : undefined;
  const patchPaths = typeof patchText === "string"
    ? new Set([...patchText.matchAll(/^\*\*\* (?:Update|Add) File: (.+)$/gm)].map((match) => match[1]))
    : new Set<string>();
  const showOutput = part.toolName === "write" || part.toolName === "edit" ||
    (part.toolName === "bash" && (part.status === "pending" || part.status === "running"));
  const rawDetails = rawMetadata === undefined && (!partial || (part.input === undefined && part.output === undefined)) ? null : (
    <details className="mt-1 text-xs text-muted-foreground">
      <summary className="cursor-pointer">Raw tool details</summary>
      {partial && part.input !== undefined && (
        <ToolValueRenderer value={part.input} keyName="input" />
      )}
      {partial && part.output !== undefined && (
        <ToolValueRenderer value={part.output} keyName="output" />
      )}
      {rawMetadata !== undefined && <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap wrap-anywhere">
        {JSON.stringify(rawMetadata, null, 2)}
      </pre>}
    </details>
  );
  const details = (
    <div>
      {part.displayContent && part.output !== part.displayContent && part.output !== part.displayContent[0] && part.displayContent.map((value, index) => (
        <ToolValueRenderer key={index} value={value} keyName="content" />
      ))}
      {part.locations?.map((location, index) => (
        <div key={index}>{location.path}{location.line != null ? `:${location.line}` : ""}</div>
      ))}
      {part.terminalIds?.map((id) => <div key={id}>Terminal: {id}</div>)}
      {part.changes?.filter((change) => !patchPaths.has(change.path)).map((change, index) =>
        change.before === undefined ? (
          <ToolValueRenderer key={index} value={change} keyName="change" />
        ) : (
          <DiffViewer
            key={index}
            diff={createTwoFilesPatch(change.path, change.path, change.before, change.after)}
            filePath={change.path}
            viewMode="line-by-line"
            showLineNumbers={true}
          />
        ),
      )}
    </div>
  );
  if (!part.toolName || !part.status) {
    return (
      <div>
        <div>
          {part.title ?? (part.toolName ? `Tool activity: ${part.toolName}` : "Tool activity")}
          {part.status ? ` (${part.status})` : ""}
        </div>
        {part.input !== undefined && <ToolValueRenderer value={part.input} keyName="input" />}
        {part.output !== undefined && <ToolValueRenderer value={part.output} keyName="output" />}
        {details}
        {rawDetails}
      </div>
    );
  }
  const ToolComponent = getToolComponent(part.toolName);
  const state = part.state ?? {
    status: part.status === "failed" ? "error" : part.status,
    title: part.title,
    input:
      typeof part.input === "object" && part.input !== null
        ? (part.input as Record<string, unknown>)
        : part.input === undefined
          ? {}
          : { value: part.input },
    output: part.output,
    error: part.error,
  };
  return (
    <div>
      <ToolComponent tool={part.toolName} state={state} />
      {showOutput && part.output !== undefined && (
        <ToolValueRenderer value={part.output} keyName="output" />
      )}
      {details}
      {rawDetails}
    </div>
  );
}
