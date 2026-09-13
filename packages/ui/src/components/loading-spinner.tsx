import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
}

export function LoadingSpinner({ text = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      <span>{text}</span>
    </div>
  );
}
