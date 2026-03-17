import { useState, useMemo } from "react";
import { Check, Copy } from "lucide-react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark-dimmed.css";

interface CodeBlockProps {
  children: string;
  className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "text";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedCode = useMemo(() => {
    if (language && hljs.getLanguage(language)) {
      try {
        return hljs.highlight(children, { language }).value;
      } catch {
        return children;
      }
    }
    try {
      return hljs.highlightAuto(children).value;
    } catch {
      return children;
    }
  }, [children, language]);

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#404040]">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
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
      <pre className="p-4 overflow-x-auto">
        {/* TODO find solution later */}
        <code
          className={`${className} text-sm font-mono leading-relaxed text-gray-300`}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    </div>
  );
}
