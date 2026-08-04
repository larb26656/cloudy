import { Loader2 } from "lucide-react";
import type { StateSize } from "./empty-state/base";
import { Center } from "@/components/layout";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  title?: string;
  message?: string;
  size?: StateSize;
}

export function LoadingState({
  title = "Loading",
  message,
  size = "full",
}: LoadingStateProps) {
  if (size === "inline") {
    return (
      <Center className="gap-2 py-2 px-2">
        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{title}</span>
      </Center>
    );
  }

  const isFull = size === "full";
  const glyph = isFull ? "size-5" : "size-4";
  const pad = isFull ? "py-8 px-4" : "py-4 px-4";
  const titleClass = isFull ? "font-medium" : "text-sm font-medium";

  return (
    <div className={cn("flex flex-col items-center justify-center", pad)}>
      <div className="flex items-center gap-2 mb-2">
        <Loader2 className={cn(glyph, "animate-spin")} />
        <span className={titleClass}>{title}</span>
      </div>
      {message && (
        <p className="text-sm text-muted-foreground text-center">{message}</p>
      )}
    </div>
  );
}
