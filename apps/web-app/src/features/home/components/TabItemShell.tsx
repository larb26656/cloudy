import { useRef, useState, type ReactNode } from "react";
import { Copy, X } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";

interface TabItemShellProps {
  icon: ReactNode;
  label?: ReactNode;
  isActive: boolean;
  onClick: () => void;
  onClose?: () => void;
  onDuplicate?: () => void;
}

export function TabItemShell({
  icon,
  label,
  isActive,
  onClick,
  onClose,
  onDuplicate,
}: TabItemShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const contextMenuRequested = useRef(false);
  const tabButton = (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors duration-150",
        isActive
          ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className="[&>svg]:size-4">{icon}</span>
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

  if (!onDuplicate) return tabButton;

  return (
    <DropdownMenu
      open={menuOpen}
      onOpenChange={(open) => {
        if (open && !contextMenuRequested.current) return;
        contextMenuRequested.current = false;
        setMenuOpen(open);
      }}
    >
      <DropdownMenuTrigger
        render={tabButton}
        onClick={(event) => event.preventDefault()}
        onContextMenu={(event) => {
          event.preventDefault();
          contextMenuRequested.current = true;
          setMenuOpen(true);
        }}
      />
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy />
          Duplicate tab
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
