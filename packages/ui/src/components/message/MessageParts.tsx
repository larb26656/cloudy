import type { ChatMessage, MessagePart } from "@repo/ai-core";
import { lazy } from "react";
import {
  TextPart,
  SubtaskPart,
  ReasoningPart,
  FilePart,
  StepStartPart,
  StepFinishPart,
  SnapshotPart,
  PatchPart,
  AgentPart,
  RetryPart,
  CompactionPart,
} from "./parts";

const ToolPart = lazy(() =>
  import("./parts/ToolPart").then((module) => ({
    default: module.ToolPart,
  })),
);

interface MessagePartsProps {
  parts: MessagePart[];
  info?: ChatMessage;
}

export function MessageParts({ parts, info }: MessagePartsProps) {
  return (
    <div className="flex flex-col gap-3">
      {parts.map((part, index) => {
        // Use index-based key for stability during streaming.
        // During streaming, parts are appended (not inserted), so index remains stable.
        // If we used part.id and it was undefined initially but assigned later,
        // React would remount the component, losing local state (like open dialogs).
        const partKey = `part-${index}`;

        switch (part.type) {
          case "text":
            return <TextPart key={partKey} part={part} />;

          case "subtask":
            return <SubtaskPart key={partKey} part={part} />;

          case "reasoning":
            return <ReasoningPart key={partKey} part={part} />;

          case "file":
            return <FilePart key={partKey} part={part} />;

          case "tool":
            return <ToolPart key={partKey} part={part} />;

          case "step-start":
            return <StepStartPart key={partKey} part={part} />;

          case "step-finish":
            return <StepFinishPart key={partKey} part={part} info={info} />;

          case "snapshot":
            return <SnapshotPart key={partKey} part={part} />;

          case "diff":
            return <PatchPart key={partKey} part={part} />;

          case "agent":
            return <AgentPart key={partKey} part={part} />;

          case "retry":
            return <RetryPart key={partKey} part={part} />;

          case "compaction":
            return <CompactionPart key={partKey} part={part} />;

          case "unknown": {
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
            const callId =
              typeof raw.callID === "string" ? raw.callID : undefined;

            return (
              <div
                key={partKey}
                className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-sm text-muted-foreground"
              >
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
        }
      })}
    </div>
  );
}
