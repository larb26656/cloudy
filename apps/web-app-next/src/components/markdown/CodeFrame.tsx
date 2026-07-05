import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

interface CodeFrameProps {
  children: ReactNode;
  language?: string;
  code?: string;
  header?: ReactNode;
  actions?: ReactNode;
  headless?: boolean;
}

export function CodeFrame({
  children,
  language,
  code,
  header,
  actions,
  headless = false,
}: CodeFrameProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (code) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const defaultActions = (
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
  );

  if (headless) {
    return <>{children}</>;
  }

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-2 py-1 bg-[#2d2d2d] border-b border-[#404040]">
        <span className="text-xs text-gray-400 font-mono">
          {header || language}
        </span>
        <div className="flex items-center gap-2">
          {actions}
          {actions ? null : code && defaultActions}
        </div>
      </div>
      {children}
    </div>
  );
}
