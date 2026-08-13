import { useMemo } from "react";
import {
  Decoration,
  Diff,
  Hunk,
  markEdits,
  parseDiff,
  tokenize,
} from "react-diff-view";
import "react-diff-view/style/index.css";
import { normalizeDiff } from "@/lib/diff";
import { getRefractorLanguage } from "@/lib/highlight";
import refractor from "@/lib/refractor-custom";
import { cn } from "@/lib/utils";
import type { DiffType, HunkData, HunkTokens } from "react-diff-view";

interface DiffViewProps {
  diff: string;
  filePath: string;
  viewMode: "side-by-side" | "line-by-line";
  showLineNumbers: boolean;
  maxHeight?: number | string;
  className?: string;
}

export function DiffView({
  diff,
  filePath,
  viewMode,
  showLineNumbers,
  maxHeight,
  className,
}: DiffViewProps) {
  const refractorLanguage = getRefractorLanguage(filePath);
  const viewType = viewMode === "side-by-side" ? "split" : "unified";

  const { hunks, diffType } = useMemo<{
    hunks: HunkData[];
    diffType: DiffType;
  }>(() => {
    const files = parseDiff(normalizeDiff(diff), { nearbySequences: "zip" });
    const file =
      files.find((candidate) => candidate.hunks.length > 0) ?? files[0];
    return {
      hunks: file?.hunks ?? [],
      diffType: (file?.type ?? "modify") as DiffType,
    };
  }, [diff]);

  const tokens = useMemo<HunkTokens | null>(() => {
    if (hunks.length === 0) return null;
    try {
      if (refractorLanguage && refractor.registered(refractorLanguage)) {
        return tokenize(hunks, {
          highlight: true,
          refractor,
          language: refractorLanguage,
          enhancers: [markEdits(hunks)],
        });
      }
      return tokenize(hunks, {
        enhancers: [markEdits(hunks)],
      });
    } catch {
      return null;
    }
  }, [hunks, refractorLanguage]);

  const maxHeightStyle =
    typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;

  return (
    <div
      className={cn("diff-viewer-dark overflow-auto", className)}
      style={maxHeightStyle ? { maxHeight: maxHeightStyle } : undefined}
    >
      {hunks.length === 0 ? (
        <div className="px-3 py-4 text-xs text-gray-500">No changes</div>
      ) : (
        <Diff
          diffType={diffType}
          hunks={hunks}
          viewType={viewType}
          gutterType={showLineNumbers ? "default" : "none"}
          tokens={tokens}
          optimizeSelection={viewType === "split"}
        >
          {(hunkList) =>
            hunkList.flatMap((hunk) => [
              <Decoration key={`decoration-${hunk.content}`}>
                <span className="text-xs text-gray-500 font-mono select-none">
                  {hunk.content}
                </span>
              </Decoration>,
              <Hunk key={`hunk-${hunk.content}`} hunk={hunk} />,
            ])
          }
        </Diff>
      )}
    </div>
  );
}
