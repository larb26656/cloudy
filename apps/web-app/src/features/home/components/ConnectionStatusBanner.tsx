import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useGlobalEvent } from "@/providers";
import { WifiOffIcon } from "lucide-react";
import { useEffect, useState } from "react";

const PENDING_DELAY = 500;

function ConnectionStatusBanner() {
  const { status, reconnect } = useGlobalEvent();
  const [showPending, setShowPending] = useState(false);

  useEffect(() => {
    if (status !== "PENDING") {
      setShowPending(false);
      return;
    }
    const id = setTimeout(() => setShowPending(true), PENDING_DELAY);
    return () => clearTimeout(id);
  }, [status]);

  if (status === "DISCONNECTED") {
    return (
      <ErrorState
        size="inline"
        icon={WifiOffIcon}
        title="Connection lost."
        retryLabel="Reconnect"
        onRetry={reconnect}
        className="bg-red-500/10 dark:bg-red-500/20 py-1 px-2 text-xs text-red-700 dark:text-red-300"
      />
    );
  }

  if (status === "PENDING" && showPending) {
    return (
      <LoadingState
        size="inline"
        title="Connecting..."
        className="bg-muted/40 py-1 px-2 text-xs text-muted-foreground"
      />
    );
  }

  return null;
}

export { ConnectionStatusBanner };
