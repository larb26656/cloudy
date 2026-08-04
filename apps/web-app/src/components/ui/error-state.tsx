import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./button";
import type { StateSize } from "./empty-state/base";
import { Center } from "@/components/layout";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  size?: StateSize;
}

export function ErrorState({
  title = "Error",
  message,
  onRetry,
  size = "full",
}: ErrorStateProps) {
  if (size === "inline") {
    return (
      <Center className="gap-2 py-2 px-2">
        <AlertCircle className="size-3.5 text-destructive" />
        <span className="text-sm text-destructive">{title}</span>
      </Center>
    );
  }

  const isFull = size === "full";
  const glyph = isFull ? "size-5" : "size-4";
  const pad = isFull ? "py-8 px-4" : "py-4 px-4";
  const titleClass = isFull ? "font-medium" : "text-sm font-medium";
  const msgMax = isFull ? "max-w-sm" : "max-w-xs";

  return (
    <div className={cn("flex flex-col items-center justify-center", pad)}>
      <div className="flex items-center gap-2 text-destructive mb-2">
        <AlertCircle className={glyph} />
        <span className={titleClass}>{title}</span>
      </div>
      <p
        className={cn("text-sm text-muted-foreground text-center mb-4", msgMax)}
      >
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw className="size-4 mr-2" />
          Try again
        </Button>
      )}
    </div>
  );
}
