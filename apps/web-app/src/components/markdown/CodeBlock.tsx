import { useMemo } from "react";
import { highlightCode, detectLanguage } from "@/lib/highlight";
import { CodeFrame } from "./CodeFrame";

interface CodeBlockProps {
  children: string;
  fileName?: string;
  headless?: boolean;
  showLineNumbers?: boolean;
}

export function CodeBlock({
  children,
  fileName,
  headless = false,
  showLineNumbers = false,
}: CodeBlockProps) {
  const language = fileName ? detectLanguage(fileName) : "plaintext";

  const highlightedCode = useMemo(() => {
    return highlightCode(children, language);
  }, [children, language]);

  if (showLineNumbers) {
    const lines = highlightedCode.split("\n");
    return (
      <CodeFrame language={language} code={children} headless={headless}>
        <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
          <code className="text-gray-300">
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
      </CodeFrame>
    );
  }

  return (
    <CodeFrame language={language} code={children} headless={headless}>
      <pre className="p-4 overflow-x-auto">
        <code
          className="text-sm font-mono leading-relaxed text-gray-300"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    </CodeFrame>
  );
}
