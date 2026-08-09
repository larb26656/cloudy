import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInlineRename } from "@/hooks/useInlineRename";
import { cn } from "@/lib/utils";

interface SessionTitleInputProps {
  sessionId: string;
  directory?: string;
  initialTitle: string;
  onDone?: () => void;
  className?: string;
}

export function SessionTitleInput({
  sessionId,
  directory,
  initialTitle,
  onDone,
  className,
}: SessionTitleInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { value, isPending, setValue, commit, cancel } = useInlineRename({
    sessionId,
    directory,
    initialTitle,
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    if (submitted && !isPending) {
      onDone?.();
    }
  }, [submitted, isPending, onDone]);

  const handleSubmit = () => {
    commit();
    setSubmitted(true);
  };

  const handleCancel = () => {
    cancel();
    onDone?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      handleCancel();
    }
  };

  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        disabled={isPending}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        className="w-full rounded border border-input bg-background px-1 py-0.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60"
      />
      {isPending && (
        <Loader2 className="pointer-events-none absolute right-1 size-3.5 animate-spin text-muted-foreground" />
      )}
    </span>
  );
}
