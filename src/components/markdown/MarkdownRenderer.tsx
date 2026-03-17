// components/markdown/MarkdownRenderer.tsx
import ReactMarkdown from "react-markdown";
import { CodeBlock } from "./CodeBlock";
import "highlight.js/styles/github-dark-dimmed.css";

interface MarkdownRendererProps {
  content: string;
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded text-sm font-mono">
      {children}
    </code>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose dark:prose-invert text-base max-w-none">
      <ReactMarkdown
        components={{
          code(props) {
            const { children, className } = props;
            const codeContent = String(children).replace(/\n$/, "");

            // Check if inline by looking for newline or if it's a code block
            const isInline = !className && !codeContent.includes("\n");

            if (isInline) {
              return <InlineCode>{codeContent}</InlineCode>;
            }

            return <CodeBlock className={className}>{codeContent}</CodeBlock>;
          },
          // Custom table styling
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-gray-100 dark:bg-gray-800">{children}</thead>
            );
          },
          th({ children }) {
            return (
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left font-semibold">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                {children}
              </td>
            );
          },
          // Custom heading styling
          h1({ children }) {
            return <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>;
          },
          // Custom list styling
          ul({ children }) {
            return (
              <ul className="list-disc pl-5 my-3 space-y-1">{children}</ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="list-decimal pl-5 my-3 space-y-1">{children}</ol>
            );
          },
          // Custom blockquote styling
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-600 dark:text-gray-400">
                {children}
              </blockquote>
            );
          },
          // Custom link styling
          a({ children, href }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {children}
              </a>
            );
          },
          // Custom horizontal rule
          hr() {
            return <hr className="my-6 border-gray-300 dark:border-gray-700" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
