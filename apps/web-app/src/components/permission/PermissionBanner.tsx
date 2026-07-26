import { ShieldAlert } from "lucide-react";

interface PermissionBannerProps {
  onOpenDialog: () => void;
  count: number;
}

export function PermissionBanner({
  onOpenDialog,
  count,
}: PermissionBannerProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onOpenDialog}
      className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs font-medium rounded-full shadow-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1.5"
    >
      <ShieldAlert size={16} />
      {count}
    </button>
  );
}
