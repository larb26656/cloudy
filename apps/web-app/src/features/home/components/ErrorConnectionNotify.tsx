import { WifiOffIcon } from "lucide-react";

function ErrorConnectionNotify() {
  return (
    <div className="flex items-center justify-center gap-2 bg-red-500/10 dark:bg-red-500/20 py-1 px-2 text-xs text-red-700 dark:text-red-300">
      <WifiOffIcon className="size-3.5" />
      <span>Connection lost. Retrying...</span>
    </div>
  );
}

export { ErrorConnectionNotify };
