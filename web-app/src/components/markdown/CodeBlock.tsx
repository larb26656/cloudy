import { useMemo } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark-dimmed.css";
import { CodeFrame } from "./CodeFrame";

interface CodeBlockProps {
  children: string;
  className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  const language = className?.replace("language-", "") || "text";

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
    <CodeFrame language={language} code={children}>
      <pre className="p-4 overflow-x-auto">
        <code
          className={`${className} text-sm font-mono leading-relaxed text-gray-300`}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    </CodeFrame>
  );
}
