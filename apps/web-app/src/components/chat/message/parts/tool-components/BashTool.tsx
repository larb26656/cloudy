import { Terminal } from "lucide-react";
import { CodeBlock } from "@/components/markdown/CodeBlock";
import { ToolPreviewLabel } from "../ToolPreviewLabel";
import { ExpandableToolCard } from "./ExpandableToolCard";
import type { ToolComponentProps } from "./types";

export function BashTool({ state }: ToolComponentProps) {
  const command = state.input.command as string | undefined;
  const label = command || "Running command...";

  return (
    <ExpandableToolCard
      tool="bash"
      state={state}
      preview={
        <ToolPreviewLabel
          icon={<Terminal className="size-3" />}
          label={label}
        />
      }
      detail={<CodeBlock>{label}</CodeBlock>}
    />
  );
}
