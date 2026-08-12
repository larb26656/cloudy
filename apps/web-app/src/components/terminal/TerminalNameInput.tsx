import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useUpdatePtySession } from "@/hooks/queries";
import { cn } from "@/lib/utils";

interface TerminalNameInputProps {
  sessionId: string;
  initialName: string;
  onDone?: () => void;
  className?: string;
}

export function TerminalNameInput({
  sessionId,
  initialName,
  onDone,
  className,
}: TerminalNameInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const finishedRef = useRef(false);
  const [value, setValue] = useState(initialName);
  const updateSession = useUpdatePtySession();

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const finish = (save: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const name = value.trim();
    if (save && name && name !== initialName) {
      updateSession.mutate(
        { id: sessionId, name },
        { onSettled: () => onDone?.() },
      );
      return;
    }
    onDone?.();
  };

  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <input
        ref={inputRef}
        value={value}
        maxLength={80}
        disabled={updateSession.isPending}
        spellCheck={false}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => finish(true)}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            finish(true);
          } else if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            finish(false);
          }
        }}
        className="w-full rounded border border-input bg-background px-1 py-0.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60"
      />
      {updateSession.isPending && (
        <Loader2 className="pointer-events-none absolute right-1 size-3.5 animate-spin text-muted-foreground" />
      )}
    </span>
  );
}
