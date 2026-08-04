import { ErrorState } from "@/components/ui/error-state";
import { useGlobalEvent } from "@/providers";
import { WifiOffIcon } from "lucide-react";

function ErrorConnectionNotify() {
  const { reconnect } = useGlobalEvent();
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

export { ErrorConnectionNotify };
