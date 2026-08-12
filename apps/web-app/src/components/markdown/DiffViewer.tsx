import { useState } from "react";
import { AlignJustify, Check, Columns, Copy, Hash } from "lucide-react";
import { detectLanguage } from "@/lib/highlight";
import { CodeFrame } from "./CodeFrame";
import { DiffView } from "./DiffView";

interface DiffViewerProps {
  diff: string;
  title?: string;
  viewMode?: "side-by-side" | "line-by-line";
  filePath: string;
  defaultViewMode?: "side-by-side" | "line-by-line";
  showLineNumbers?: boolean;
}

export function DiffViewer({
  diff,
  title,
  viewMode: initialViewMode,
  filePath,
  defaultViewMode = "side-by-side",
  showLineNumbers: controlledShowLineNumbers,
}: DiffViewerProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState(defaultViewMode);
  const [showLineNumbersState, setShowLineNumbersState] = useState(false);

  const isControlled = initialViewMode !== undefined;
  const isLineNumbersControlled = controlledShowLineNumbers !== undefined;
  const showLineNumbers = isLineNumbersControlled
    ? controlledShowLineNumbers
    : showLineNumbersState;
  const currentViewMode = isControlled ? initialViewMode : viewMode;
  const language = detectLanguage(filePath);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(diff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleViewMode = () => {
    setViewMode((previous) =>
      previous === "side-by-side" ? "line-by-line" : "side-by-side",
    );
  };

  const header = (
    <>
      <span className="text-xs text-gray-400 mr-2">[{language}]</span>
      {title || filePath || "Diff"}
    </>
  );

  const actions = (
    <>
      {!isControlled && (
        <button
          onClick={toggleViewMode}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded hover:bg-[#404040]"
          title={
            currentViewMode === "side-by-side"
              ? "Switch to unified view"
              : "Switch to split view"
          }
        >
          {currentViewMode === "side-by-side" ? (
            <>
              <AlignJustify className="w-3 h-3" />
              Unified
            </>
          ) : (
            <>
              <Columns className="w-3 h-3" />
              Split
            </>
          )}
        </button>
      )}
      {!isLineNumbersControlled && (
        <button
          onClick={() => setShowLineNumbersState((previous) => !previous)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded hover:bg-[#404040]"
          title={showLineNumbers ? "Hide line numbers" : "Show line numbers"}
        >
          <Hash className="w-3 h-3" />
          {showLineNumbers ? "Hide #" : "Show #"}
        </button>
      )}
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded hover:bg-[#404040]"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            Copy
          </>
        )}
      </button>
    </>
  );

  return (
    <CodeFrame header={header} actions={actions}>
      <DiffView
        diff={diff}
        filePath={filePath}
        viewMode={currentViewMode}
        showLineNumbers={showLineNumbers}
      />
    </CodeFrame>
  );
}
