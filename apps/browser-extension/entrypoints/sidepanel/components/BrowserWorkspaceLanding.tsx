import { FolderCog } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";

interface BrowserWorkspaceLandingProps {
  isLoading: boolean;
  isInitializing: boolean;
  error: Error | null;
  onInitialize: () => void;
  onRetry: () => void;
}

export function BrowserWorkspaceLanding({
  isLoading,
  isInitializing,
  error,
  onInitialize,
  onRetry,
}: BrowserWorkspaceLandingProps) {
  if (isLoading || isInitializing) {
    return (
      <LoadingState
        className="h-screen"
        title={
          isInitializing
            ? "Setting up browser workspace..."
            : "Checking browser workspace..."
        }
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        className="h-screen"
        title="Cloudy is unavailable"
        message={error.message}
        onRetry={onRetry}
        retryLabel="Try again"
      />
    );
  }

  return (
    <EmptyState
      className="h-screen px-6"
      icon={FolderCog}
      title="Set up Cloudy for your browser"
      description="Cloudy will create a dedicated workspace for browser conversations."
      action={
        <Button onClick={onInitialize} disabled={isInitializing}>
          Initialize workspace
        </Button>
      }
    />
  );
}
