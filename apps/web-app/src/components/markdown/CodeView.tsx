import { useMemo } from "react";
import { detectLanguage, highlightCode } from "@/lib/highlight";

interface CodeViewProps {
  children: string;
  fileName?: string;
  showLineNumbers?: boolean;
}

export function CodeView({
  children,
  fileName,
  showLineNumbers = false,
}: CodeViewProps) {
  const language = fileName ? detectLanguage(fileName) : "plaintext";
  const highlightedCode = useMemo(
    () => highlightCode(children, language),
    [children, language],
  );

  if (showLineNumbers) {
    const lines = highlightedCode.split("\n");
    return (
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <code className="syntax-highlight text-gray-300">
          {lines.map((line, i) => (
            <span key={i} className="flex">
              <span className="select-none text-gray-600 w-12 text-right pr-4 flex-shrink-0">
                {i + 1}
              </span>
              <span dangerouslySetInnerHTML={{ __html: line || " " }} />
            </span>
          ))}
        </code>
      </pre>
    );
  }

  return (
    <pre className="p-4 overflow-x-auto">
      <code
        className="syntax-highlight text-sm font-mono leading-relaxed text-gray-300"
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </pre>
  );
}
