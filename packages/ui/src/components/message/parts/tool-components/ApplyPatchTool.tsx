import { Files } from "lucide-react";
import { CodeBlock, DiffViewer } from "@repo/ui/components/markdown";
import { PathText } from "@repo/ui/components/path-text";
import { ToolPreviewLabel } from "../ToolPreviewLabel";
import type { ToolComponentProps } from "./types";

interface PatchFile {
  path: string;
  diff: string;
}

export function ApplyPatchTool({ state }: ToolComponentProps) {
  const patchText =
    typeof state.input.patchText === "string" ? state.input.patchText : "";
  const patches = toUnifiedDiffs(patchText);

  if (patches.length === 0) {
    return patchText ? <CodeBlock>{patchText}</CodeBlock> : null;
  }

  return (
    <div className="space-y-1">
      {patches.map(({ path, diff }) => (
        <div key={path} className="space-y-1">
          <DiffViewer
            diff={diff}
            filePath={path}
            viewMode="line-by-line"
            showLineNumbers={true}
          />
          <ToolPreviewLabel
            icon={<Files className="size-3" />}
            label={<PathText path={path} className="font-mono" />}
          />
        </div>
      ))}
    </div>
  );
}

function toUnifiedDiffs(patchText: string): PatchFile[] {
  const files: Array<{
    action: "Update" | "Add";
    path: string;
    lines: string[];
  }> = [];
  let file: (typeof files)[number] | undefined;

  for (const line of patchText.split("\n")) {
    const match = line.match(/^\*\*\* (Update|Add) File: (.+)$/);
    if (match?.[1] && match[2]) {
      file = {
        action: match[1] as "Update" | "Add",
        path: match[2],
        lines: [],
      };
      files.push(file);
    } else if (!line.startsWith("***") && file) {
      file.lines.push(line);
    }
  }

  return files.flatMap(({ action, path, lines }) => {
    const hunks = action === "Add" ? [lines] : splitHunks(lines);
    const diff = hunks
      .filter((hunk) => hunk.length > 0)
      .map((hunk) => {
        const oldCount = hunk.filter((line) => !line.startsWith("+")).length;
        const newCount = hunk.filter((line) => !line.startsWith("-")).length;
        const oldStart = oldCount === 0 ? 0 : 1;
        const newStart = newCount === 0 ? 0 : 1;
        const unifiedHunk = hunk.map((line) =>
          line.startsWith("+") || line.startsWith("-") || line.startsWith("\\")
            ? line
            : ` ${line}`,
        );
        return `@@ -${oldStart},${oldCount} +${newStart},${newCount} @@\n${unifiedHunk.join("\n")}`;
      })
      .join("\n");

    return diff
      ? [{ path, diff: `--- a/${path}\n+++ b/${path}\n${diff}` }]
      : [];
  });
}

function splitHunks(lines: string[]): string[][] {
  const hunks: string[][] = [];
  let hunk: string[] | undefined;

  for (const line of lines) {
    if (line.startsWith("@@")) {
      hunk = [];
      hunks.push(hunk);
    } else if (hunk) {
      hunk.push(line);
    }
  }

  return hunks;
}
