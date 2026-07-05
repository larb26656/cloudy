import type { Part, AssistantMessage } from "@opencode-ai/sdk/v2";
import {
  TextPart,
  SubtaskPart,
  ReasoningPart,
  FilePart,
  ToolPart,
  StepFinishPart,
  SnapshotPart,
  PatchPart,
  AgentPart,
  RetryPart,
  CompactionPart,
} from "./parts";

interface MessagePartsProps {
  parts: Part[];
  info?: AssistantMessage;
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
            return null;

          case "step-finish":
            return <StepFinishPart key={partKey} part={part} info={info} parts={parts} />;

          case "snapshot":
            return <SnapshotPart key={partKey} part={part} />;

          case "patch":
            return <PatchPart key={partKey} part={part} />;

          case "agent":
            return <AgentPart key={partKey} part={part} />;

          case "retry":
            return <RetryPart key={partKey} part={part} />;

          case "compaction":
            return <CompactionPart key={partKey} part={part} />;

          default: {
            const unknownPart = part as { type: string };
            return (
              <div key={partKey} className="text-sm text-muted-foreground">
                Unknown part type: {unknownPart.type}
              </div>
            );
          }
        }
      })}
    </div>
  );
}
