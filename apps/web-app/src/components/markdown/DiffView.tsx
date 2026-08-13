import { useEffect, useMemo, useState } from "react";
import {
  Decoration,
  Diff,
  Hunk,
  markEdits,
  parseDiff,
  tokenize,
} from "react-diff-view";
import "react-diff-view/style/index.css";
import { Button } from "@/components/ui/button";
import { normalizeDiff } from "@/lib/diff";
import { getRefractorLanguage } from "@/lib/highlight";
import refractor from "@/lib/refractor-custom";
import { cn } from "@/lib/utils";
import type {
  DiffType,
  HunkData,
  HunkTokens,
  RenderGutter,
} from "react-diff-view";

const renderGutter: RenderGutter = ({
  change,
  side,
  renderDefault,
  wrapInAnchor,
}) => {
  const singleGutterLineNumber =
    side === "new" && change.type === "delete" ? (
      <span>{change.lineNumber}</span>
    ) : null;

  return wrapInAnchor(
    <>
      {renderDefault()}
      {singleGutterLineNumber}
    </>,
  );
};

interface DiffViewProps {
  diff: string;
  filePath: string;
  viewMode: "side-by-side" | "line-by-line";
  showLineNumbers: boolean;
  showOnlyChanges?: boolean;
  compactContextLines?: number;
  showFullContextToggle?: boolean;
  progressiveLineLimit?: number;
  maxHeight?: number | string;
  className?: string;
}

type DiffSection =
  | { type: "header"; key: string; content: string }
  | { type: "omission"; key: string; count: number }
  | { type: "hunk"; key: string; hunk: HunkData };

interface DiffSections {
  sections: DiffSection[];
  hunks: HunkData[];
  hiddenLines: number;
}

function countLines(value: string): number {
  if (!value) return 0;

  let count = value.endsWith("\n") ? 0 : 1;
  for (let index = 0; index < value.length; index += 1) {
    if (value.charCodeAt(index) === 10) count += 1;
  }
  return count;
}

function takeLines(value: string, limit: number): string {
  let lineEnd = -1;

  for (let line = 0; line < limit; line += 1) {
    lineEnd = value.indexOf("\n", lineEnd + 1);
    if (lineEnd === -1) return value;
  }

  return value.slice(0, lineEnd);
}

function createDiffSections(
  hunks: HunkData[],
  contextLines?: number,
): DiffSections {
  const sections: DiffSection[] = [];
  const visibleHunks: HunkData[] = [];
  let hiddenLines = 0;

  hunks.forEach((hunk, hunkIndex) => {
    sections.push({
      type: "header",
      key: `header-${hunkIndex}`,
      content: hunk.content,
    });

    if (contextLines === undefined) {
      sections.push({
        type: "hunk",
        key: `hunk-${hunkIndex}`,
        hunk,
      });
      visibleHunks.push(hunk);
      return;
    }

    const visibleChanges = new Array<boolean>(hunk.changes.length).fill(false);
    hunk.changes.forEach((change, changeIndex) => {
      if (change.type === "normal") return;

      visibleChanges[changeIndex] = true;
      for (
        let index = changeIndex - 1, context = 0;
        index >= 0 && context < contextLines;
        index -= 1
      ) {
        if (hunk.changes[index]?.type !== "normal") break;
        visibleChanges[index] = true;
        context += 1;
      }
      for (
        let index = changeIndex + 1, context = 0;
        index < hunk.changes.length && context < contextLines;
        index += 1
      ) {
        if (hunk.changes[index]?.type !== "normal") break;
        visibleChanges[index] = true;
        context += 1;
      }
    });

    let index = 0;
    let sectionIndex = 0;
    while (index < hunk.changes.length) {
      const isVisible = visibleChanges[index];
      const start = index;
      while (
        index < hunk.changes.length &&
        visibleChanges[index] === isVisible
      ) {
        index += 1;
      }

      if (!isVisible) {
        const count = index - start;
        hiddenLines += count;
        sections.push({
          type: "omission",
          key: `omission-${hunkIndex}-${sectionIndex}`,
          count,
        });
      } else {
        const visibleHunk = {
          ...hunk,
          changes: hunk.changes.slice(start, index),
        };
        visibleHunks.push(visibleHunk);
        sections.push({
          type: "hunk",
          key: `hunk-${hunkIndex}-${sectionIndex}`,
          hunk: visibleHunk,
        });
      }
      sectionIndex += 1;
    }
  });

  return { sections, hunks: visibleHunks, hiddenLines };
}

export function DiffView({
  diff,
  filePath,
  viewMode,
  showLineNumbers,
  showOnlyChanges = false,
  compactContextLines,
  showFullContextToggle = false,
  progressiveLineLimit,
  maxHeight,
  className,
}: DiffViewProps) {
  const [progressiveState, setProgressiveState] = useState({
    diff,
    filePath,
    pageSize: progressiveLineLimit,
    lineLimit: progressiveLineLimit ?? 0,
  });
  const isCurrentProgressiveState =
    progressiveState.diff === diff &&
    progressiveState.filePath === filePath &&
    progressiveState.pageSize === progressiveLineLimit;
  const visibleLineLimit = isCurrentProgressiveState
    ? progressiveState.lineLimit
    : (progressiveLineLimit ?? 0);

  useEffect(() => {
    if (!isCurrentProgressiveState) {
      setProgressiveState({
        diff,
        filePath,
        pageSize: progressiveLineLimit,
        lineLimit: progressiveLineLimit ?? 0,
      });
    }
  }, [diff, filePath, isCurrentProgressiveState, progressiveLineLimit]);

  const [contextState, setContextState] = useState({
    diff,
    filePath,
    contextLines: compactContextLines,
    showFullContext: false,
  });
  const isCurrentContextState =
    contextState.diff === diff &&
    contextState.filePath === filePath &&
    contextState.contextLines === compactContextLines;
  const showFullContext = isCurrentContextState
    ? contextState.showFullContext
    : false;

  useEffect(() => {
    if (!isCurrentContextState) {
      setContextState({
        diff,
        filePath,
        contextLines: compactContextLines,
        showFullContext: false,
      });
    }
  }, [compactContextLines, diff, filePath, isCurrentContextState]);

  const refractorLanguage = getRefractorLanguage(filePath);
  const viewType = viewMode === "side-by-side" ? "split" : "unified";
  const totalLines = useMemo(
    () => (progressiveLineLimit === undefined ? null : countLines(diff)),
    [diff, progressiveLineLimit],
  );
  const visibleDiff = useMemo(
    () =>
      progressiveLineLimit === undefined
        ? diff
        : takeLines(diff, visibleLineLimit),
    [diff, progressiveLineLimit, visibleLineLimit],
  );
  const hasMoreLines = totalLines !== null && visibleLineLimit < totalLines;

  const { parsedHunks, diffType } = useMemo<{
    parsedHunks: HunkData[];
    diffType: DiffType;
  }>(() => {
    const files = parseDiff(normalizeDiff(visibleDiff), {
      nearbySequences: "zip",
    });
    const file =
      files.find((candidate) => candidate.hunks.length > 0) ?? files[0];
    const parsedHunks = file?.hunks ?? [];
    return {
      parsedHunks,
      diffType: (file?.type ?? "modify") as DiffType,
    };
  }, [visibleDiff]);

  const compactSections = useMemo(
    () =>
      createDiffSections(
        parsedHunks,
        showOnlyChanges ? 0 : compactContextLines,
      ),
    [compactContextLines, parsedHunks, showOnlyChanges],
  );
  const fullSections = useMemo(
    () => createDiffSections(parsedHunks),
    [parsedHunks],
  );
  const displaySections = showFullContext ? fullSections : compactSections;
  const { hunks, sections } = displaySections;
  const canToggleFullContext =
    showFullContextToggle &&
    compactContextLines !== undefined &&
    compactSections.hiddenLines > 0;

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
      {canToggleFullContext && (
        <div className="flex justify-end border-b px-3 py-1.5">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-pressed={showFullContext}
            onClick={() =>
              setContextState({
                diff,
                filePath,
                contextLines: compactContextLines,
                showFullContext: !showFullContext,
              })
            }
          >
            {showFullContext ? "Show compact diff" : "Show full context"}
          </Button>
        </div>
      )}
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
          renderGutter={renderGutter}
        >
          {(hunkList) => {
            let hunkIndex = 0;
            return sections.map((section) => {
              if (section.type === "header") {
                return (
                  <Decoration key={section.key}>
                    <span className="font-mono text-xs text-muted-foreground select-none">
                      {section.content}
                    </span>
                  </Decoration>
                );
              }
              if (section.type === "omission") {
                return (
                  <Decoration key={section.key}>
                    <span className="font-mono text-xs text-muted-foreground select-none">
                      … {section.count} unchanged
                      {section.count === 1 ? " line" : " lines"} hidden …
                    </span>
                  </Decoration>
                );
              }

              const hunk = hunkList[hunkIndex]!;
              hunkIndex += 1;
              return <Hunk key={section.key} hunk={hunk} />;
            });
          }}
        </Diff>
      )}
      {hasMoreLines && progressiveLineLimit !== undefined && (
        <div className="flex items-center justify-between gap-3 border-t px-3 py-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            Showing {visibleLineLimit} of {totalLines} lines
          </span>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() =>
              setProgressiveState({
                diff,
                filePath,
                pageSize: progressiveLineLimit,
                lineLimit: Math.min(
                  visibleLineLimit + progressiveLineLimit,
                  totalLines,
                ),
              })
            }
          >
            Load {progressiveLineLimit} more
          </Button>
        </div>
      )}
    </div>
  );
}
