import { useMemo, useState, useEffect } from "react";
import { html as diff2html } from "diff2html";
import "diff2html/bundles/css/diff2html.min.css";
import { Check, Copy, Columns, AlignJustify, Hash } from "lucide-react";
import { ColorSchemeType } from "diff2html/lib/types";
import { CodeFrame } from "./CodeFrame";

interface DiffViewerProps {
  diff: string;
  title?: string;
  viewMode?: "side-by-side" | "line-by-line";
  fileNames?: { old: string; new: string };
  inline?: boolean;
  defaultViewMode?: "side-by-side" | "line-by-line";
  headless?: boolean;
  showLineNumbers?: boolean;
}

export function DiffViewer({
  diff,
  title,
  viewMode: initialViewMode,
  fileNames,
  inline = false,
  defaultViewMode = "side-by-side",
  headless = false,
  showLineNumbers: controlledShowLineNumbers,
}: DiffViewerProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState(defaultViewMode);
  const [showLineNumbersState, setShowLineNumbersState] = useState(false);

  const isControlled = initialViewMode !== undefined;
  const isLineNumbersControlled = controlledShowLineNumbers !== undefined;

  const showLineNumbers = isLineNumbersControlled ? controlledShowLineNumbers : showLineNumbersState;

  const currentViewMode = isControlled ? initialViewMode : viewMode;

  const diffHtml = useMemo(() => {
    return diff2html(diff, {
      drawFileList: false,
      matching: "lines",
      outputFormat:
        currentViewMode === "side-by-side" ? "side-by-side" : "line-by-line",
      renderNothingWhenEmpty: false,
      colorScheme: ColorSchemeType.DARK,
    });
  }, [diff, currentViewMode]);

  useEffect(() => {
    document.querySelectorAll(".d2h-code-line-ctn");

    // hljs.highlightElement(block as HTMLElement);

    // TODO find solution later
  }, [diffHtml, showLineNumbers]);

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "diff2html-custom-styles";
    style.textContent = `
      .d2h-file-header {
        display: none;
      }

      ${
        showLineNumbers
          ? ""
          : `
      .d2h-code-side-linenumber,
      .d2h-code-linenumber {
        display: none;
      }

      .d2h-code-side-line,
      .d2h-code-line {
        padding-left: 0 !important;
      }

      .d2h-code-side-linenumber {
        border: none;
      }
      `
      }
    `;
    if (!document.getElementById("diff2html-custom-styles")) {
      document.head.appendChild(style);
    }
    return () => {
      const existing = document.getElementById("diff2html-custom-styles");
      if (existing) {
        existing.remove();
      }
    };
  }, [showLineNumbers]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(diff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleViewMode = () => {
    setViewMode((prev) =>
      prev === "side-by-side" ? "line-by-line" : "side-by-side",
    );
  };

  if (inline) {
    return (
      <div
        className={headless ? "" : "overflow-x-auto"}
        dangerouslySetInnerHTML={{ __html: diffHtml }}
      />
    );
  }

  if (headless) {
    return (
      <div
        className="overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: diffHtml }}
      />
    );
  }

  const header = (
    <>
      {title || fileNames?.old || "Diff"}
      {fileNames?.new && fileNames.new !== fileNames.old && (
        <span className="text-gray-500 mx-1">→</span>
      )}
      {fileNames?.new && fileNames.new !== fileNames.old && (
        <span>{fileNames.new}</span>
      )}
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
          onClick={() => setShowLineNumbersState((prev) => !prev)}
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
      <div
        className="overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: diffHtml }}
      />
    </CodeFrame>
  );
}
