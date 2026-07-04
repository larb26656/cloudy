import { useStore } from "@/hooks/instanceScopeHook";
import { Button } from "@/components/ui/button";
import { Shield, XIcon } from "lucide-react";

interface PermissionBannerProps {
  onOpenDialog: () => void;
}

export function PermissionBanner({ onOpenDialog }: PermissionBannerProps) {
  const { permissions, dismissed, dismissNotification } =
    useStore("permission");

  const permissionCount = Object.values(permissions).flat().length;

  if (dismissed || permissionCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
        <Shield className="w-4 h-4" />
        <span className="text-sm font-medium">
          {permissionCount} pending permission{permissionCount !== 1 ? "s" : ""}{" "}
          waiting for your response
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/40"
          onClick={onOpenDialog}
        >
          View Permissions
        </Button>
        <Button
          size="icon-xs"
          variant="ghost"
          className="text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/40"
          onClick={dismissNotification}
        >
          <XIcon className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
