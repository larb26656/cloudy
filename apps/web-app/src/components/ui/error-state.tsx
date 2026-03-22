import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Error", message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="flex items-center gap-2 text-destructive mb-2">
        <AlertCircle className="size-5" />
        <span className="font-medium">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
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
