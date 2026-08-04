import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { StateSize } from "./empty-state/base";
import { Center } from "@/components/layout";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  title?: string | null;
  message?: string;
  size?: StateSize;
  className?: string;
  spinner?: ReactNode | false;
}

export function LoadingState({
  title = "Loading",
  message,
  size = "full",
  className,
  spinner,
}: LoadingStateProps) {
  const isInline = size === "inline";
  const isFull = size === "full";
  const glyph = isFull ? "size-5" : isInline ? "size-3.5" : "size-4";

  const spinnerEl: ReactNode = (() => {
    if (spinner === false) return null;
    if (spinner === undefined) {
      return isInline ? (
        <Loader2 className={cn(glyph, "animate-spin text-muted-foreground")} />
      ) : (
        <Loader2 className={cn(glyph, "animate-spin")} />
      );
    }
    return spinner;
  })();

  const silent = title == null || title === "";

  if (isInline) {
    return (
      <Center className={cn("gap-2 py-2 px-2", className)}>
        {spinnerEl}
        {!silent && (
          <span className="text-sm text-muted-foreground">{title}</span>
        )}
      </Center>
    );
  }

  const pad = isFull ? "py-8 px-4" : "py-4 px-4";
  const titleClass = isFull ? "font-medium" : "text-sm font-medium";

  if (silent) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center",
          pad,
          className,
        )}
      >
        {spinnerEl}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        pad,
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {spinnerEl}
        <span className={titleClass}>{title}</span>
      </div>
      {message && (
        <p className="text-sm text-muted-foreground text-center">{message}</p>
      )}
    </div>
  );
}
