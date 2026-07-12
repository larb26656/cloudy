import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  title?: string;
  message?: string;
}

export function LoadingState({
  title = "Loading",
  message,
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="flex items-center gap-2 mb-2">
        <Loader2 className="size-5 animate-spin" />
        <span className="font-medium">{title}</span>
      </div>
      {message && (
        <p className="text-sm text-muted-foreground text-center">{message}</p>
      )}
    </div>
  );
}
