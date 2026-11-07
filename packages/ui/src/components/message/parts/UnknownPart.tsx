import type { UnknownMessagePart } from "@repo/ai-core";

interface UnknownPartProps {
  part: UnknownMessagePart;
}

export function UnknownPart({ part }: UnknownPartProps) {
  let serializedData = "Unable to serialize raw part";
  try {
    serializedData = JSON.stringify(part.data, null, 2) ?? "<empty>";
  } catch {
    // Keep the message visible even if a provider returns a non-JSON value.
  }

  const raw =
    typeof part.data === "object" && part.data !== null
      ? (part.data as Record<string, unknown>)
      : {};
  const tool = typeof raw.tool === "string" ? raw.tool : undefined;
  const callId = typeof raw.callID === "string" ? raw.callID : undefined;

  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-sm text-muted-foreground">
      <div>
        Unknown part type: <strong>{part.providerType}</strong>
        {tool ? ` (tool: ${tool})` : ""}
      </div>
      <div className="text-xs">
        part id: {part.id}
        {callId ? `, call id: ${callId}` : ""}
      </div>
      <details className="mt-1 text-xs">
        <summary className="cursor-pointer">Raw part details</summary>
        <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap">
          {serializedData}
        </pre>
      </details>
    </div>
  );
}
