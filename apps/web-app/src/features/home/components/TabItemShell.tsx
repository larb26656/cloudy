import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceDot } from "@/components/workspace/WorkspaceDot";

interface TabItemShellProps {
  icon: LucideIcon;
  label?: string;
  isActive: boolean;
  onClick: () => void;
  onClose?: () => void;
  workspaceId?: string | null;
}

export function TabItemShell({
  icon: Icon,
  label,
  isActive,
  onClick,
  onClose,
  workspaceId,
}: TabItemShellProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors duration-150",
        isActive
          ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className="[&>svg]:size-4">
        <Icon />
      </span>
      <WorkspaceDot workspaceId={workspaceId ?? undefined} />
      {label !== undefined && (
        <span className="text-[13px] max-w-30 truncate">{label}</span>
      )}
      {onClose && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="ml-1 rounded p-0.5 hover:bg-muted"
        >
          <X size={12} />
        </span>
      )}
    </button>
  );
}
