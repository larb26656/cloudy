import { detectLanguage } from "@/lib/highlight";
import { CodeFrame } from "./CodeFrame";
import { CodeView } from "./CodeView";

interface CodeBlockProps {
  children: string;
  fileName?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({
  children,
  fileName,
  showLineNumbers = false,
}: CodeBlockProps) {
  const language = fileName ? detectLanguage(fileName) : "plaintext";

  return (
    <CodeFrame language={language} code={children}>
      <CodeView fileName={fileName} showLineNumbers={showLineNumbers}>
        {children}
      </CodeView>
    </CodeFrame>
  );
}
