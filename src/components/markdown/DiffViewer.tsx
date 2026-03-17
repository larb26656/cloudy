import { useMemo, useState, useId, useEffect } from "react";
import { html as diff2html } from "diff2html";
import "diff2html/bundles/css/diff2html.min.css";
import { Check, Copy, Columns, AlignJustify, Hash } from "lucide-react";
import { ColorSchemeType } from "diff2html/lib/types";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark-dimmed.css";

interface DiffViewerProps {
  diff: string;
  title?: string;
  viewMode?: "side-by-side" | "line-by-line";
  fileNames?: { old: string; new: string };
  inline?: boolean;
  defaultViewMode?: "side-by-side" | "line-by-line";
}

export function DiffViewer({
  diff,
  title,
  viewMode: initialViewMode,
  fileNames,
  inline = false,
  defaultViewMode = "side-by-side",
}: DiffViewerProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState(defaultViewMode);
  const [showLineNumbers, setShowLineNumbers] = useState(false);

  const isControlled = initialViewMode !== undefined;

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
    const blocks = document.querySelectorAll(".d2h-code-line-ctn");

    // blocks.forEach((block) => {
    //   hljs.highlightElement(block as HTMLElement);
    // });

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
    // style.textContent = `
    //   .d2h-wrapper {
    //     background: #1e1e1e;
    //     border-radius: 8px;
    //     overflow: hidden;
    //   }
    //   .d2h-file-header {
    //     background: #2d2d2d !important;
    //     border-bottom: 1px solid #404040 !important;
    //     padding: 8px 16px !important;
    //   }
    //   .d2h-file-name {
    //     color: #e0e0e0 !important;
    //   }
    //   .d2h-file-header .d2h-button {
    //     background: #404040 !important;
    //     border-color: #404040 !important;
    //     color: #e0e0e0 !important;
    //   }
    //   .d2h-files-diff {
    //     background: #1e1e1e !important;
    //   }
    //   .d2h-file-diff {
    //     background: #1e1e1e !important;
    //   }
    //   .d2h-code-side-line {
    //     font-family: 'SF Mono', Monaco, 'Andale Mono', monospace !important;
    //     font-size: 13px !important;
    //     line-height: 20px !important;
    //   }
    //   .d2h-code-line {
    //     font-family: 'SF Mono', Monaco, 'Andale Mono', monospace !important;
    //     font-size: 13px !important;
    //     line-height: 20px !important;
    //   }
    //   .d2h-code-side-linenum {
    //     color: #6e7681 !important;
    //     width: 50px !important;
    //   }
    //   .d2h-code-linenum {
    //     color: #6e7681 !important;
    //     width: 50px !important;
    //   }
    //   .d2h-code-side-del {
    //     background: rgba(255, 0, 0, 0.15) !important;
    //   }
    //   .d2h-code-side-ins {
    //     background: rgba(0, 255, 0, 0.15) !important;
    //   }
    //   .d2h-code-del {
    //     background: rgba(255, 0, 0, 0.15) !important;
    //   }
    //   .d2h-code-ins {
    //     background: rgba(0, 255, 0, 0.15) !important;
    //   }
    //   .d2h-side-left .d2h-code-line {
    //     background: rgba(255, 0, 0, 0.08) !important;
    //   }
    //   .d2h-side-right .d2h-code-line {
    //     background: rgba(0, 255, 0, 0.08) !important;
    //   }
    // `;
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
        className="overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: diffHtml }}
      />
    );
  }

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#404040]">
        <span className="text-xs text-gray-400 font-mono">
          {title || fileNames?.old || "Diff"}
          {fileNames?.new && fileNames.new !== fileNames.old && (
            <span className="text-gray-500 mx-1">→</span>
          )}
          {fileNames?.new && fileNames.new !== fileNames.old && (
            <span>{fileNames.new}</span>
          )}
        </span>
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded hover:bg-[#404040]"
            title={showLineNumbers ? "Hide line numbers" : "Show line numbers"}
          >
            <Hash className="w-3 h-3" />
            {showLineNumbers ? "Hide #" : "Show #"}
          </button>
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
        </div>
      </div>
      {/* Diff content */}
      <div
        className="overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: diffHtml }}
      />
    </div>
  );
}
