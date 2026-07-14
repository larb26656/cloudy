import { ShieldAlert } from "lucide-react";

interface PermissionBannerProps {
  onOpenDialog: () => void;
  count: number;
}

export function PermissionBanner({ onOpenDialog, count }: PermissionBannerProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onOpenDialog}
      className="fixed top-4 right-4 z-40 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs font-medium rounded-full shadow-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1.5"
    >
      <ShieldAlert className="size-3.5" />
      {count} permission{count > 1 ? "s" : ""} pending
    </button>
  );
}
