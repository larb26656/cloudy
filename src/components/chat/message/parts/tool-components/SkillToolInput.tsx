import { PlayCircle } from "lucide-react";
import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";

interface SkillToolInputProps {
  input: Record<string, unknown>;
}

export function Detail({ input }: SkillToolInputProps) {
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

export function Preview({ state }: { state: ToolPartType["state"] }) {
  const name = state.input.name as string | undefined;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <PlayCircle className="size-3 text-cyan-600 dark:text-cyan-400" />
      <span className="text-cyan-700 dark:text-cyan-300">
        {name ? `Skill: ${name}` : "Running skill..."}
      </span>
    </div>
  );
}
