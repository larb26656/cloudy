import type { ChatMessage, MessagePart } from "@repo/ai-core";
import { lazy } from "react";
import { motion, useReducedMotion } from "motion/react";
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
  UnknownPart,
} from "./parts";

const ToolPart = lazy(() =>
  import("./parts/ToolPart").then((module) => ({
    default: module.ToolPart,
  })),
);

interface MessagePartsProps {
  parts: MessagePart[];
  info?: ChatMessage;
  isStreaming?: boolean;
}

export function MessageParts({
  parts,
  info,
  isStreaming = false,
}: MessagePartsProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = isStreaming && !prefersReducedMotion;

  return (
    <div className="flex flex-col gap-1">
      {parts.map((part, index) => {
        // Use index-based key for stability during streaming.
        // During streaming, parts are appended (not inserted), so index remains stable.
        // If we used part.id and it was undefined initially but assigned later,
        // React would remount the component, losing local state (like open dialogs).
        const partKey = `part-${index}`;

        let content;
        switch (part.type) {
          case "text":
            content = <TextPart part={part} isStreaming={isStreaming} />;
            break;

          case "subtask":
            content = <SubtaskPart part={part} />;
            break;

          case "reasoning":
            content = <ReasoningPart part={part} isStreaming={isStreaming} />;
            break;

          case "file":
            content = <FilePart part={part} />;
            break;

          case "tool":
            content = <ToolPart part={part} />;
            break;

          case "step-start":
            content = <StepStartPart part={part} />;
            break;

          case "step-finish":
            content = <StepFinishPart part={part} info={info} />;
            break;

          case "snapshot":
            content = <SnapshotPart part={part} />;
            break;

          case "diff":
            content = <PatchPart part={part} />;
            break;

          case "agent":
            content = <AgentPart part={part} />;
            break;

          case "retry":
            content = <RetryPart part={part} />;
            break;

          case "compaction":
            content = <CompactionPart part={part} />;
            break;

          case "unknown":
            content = <UnknownPart part={part} />;
            break;
        }

        return (
          <motion.div
            key={partKey}
            initial={shouldAnimate ? { opacity: 0, y: 4 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {content}
          </motion.div>
        );
      })}
    </div>
  );
}
