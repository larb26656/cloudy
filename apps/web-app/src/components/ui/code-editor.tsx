import { useCallback } from "react";
import Editor from "react-simple-code-editor";

import { cn } from "@/lib/utils";
import { highlightCode } from "@/lib/highlight";

interface CodeEditorProps {
  value: string;
  onValueChange: (value: string) => void;
  language?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  onBlur?: React.ComponentProps<typeof Editor>["onBlur"];
  className?: string;
}

function CodeEditor({
  value,
  onValueChange,
  language = "plaintext",
  id,
  name,
  placeholder,
  disabled,
  readOnly,
  required,
  autoFocus,
  onBlur,
  className,
}: CodeEditorProps) {
  const highlight = useCallback(
    (code: string) => highlightCode(code, language),
    [language],
  );

  return (
    <Editor
      data-slot="code-editor"
      value={value}
      onValueChange={onValueChange}
      highlight={highlight}
      tabSize={2}
      insertSpaces
      padding={{ top: 8, right: 10, bottom: 8, left: 10 }}
      textareaId={id}
      name={name}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      autoFocus={autoFocus}
      onBlur={onBlur}
      preClassName="syntax-highlight"
      textareaClassName="outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      className={cn(
        "dark min-h-32 w-full rounded-md border border-input bg-background font-mono text-sm leading-relaxed text-foreground transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50",
        className,
      )}
      data-disabled={disabled || undefined}
      style={{ overflow: "auto" }}
    />
  );
}

export { CodeEditor };
export type { CodeEditorProps };
