import { PenTool, X } from "lucide-react";
import type { Tab } from "@/stores/tabStore";
import { cn } from "@/lib/utils";

interface DeskTabItemProps {
  /** tab prop เป็นส่วนหนึ่งของ TabBarProps interface แต่ Desk tab ไม่มี dynamic data จึงไม่ต้องใช้ */
  tab: Extract<Tab, { type: "desk" }>;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

export function DeskTabItem({ isActive, onClick, onClose }: DeskTabItemProps) {
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
        <PenTool />
      </span>
      <span className="text-[13px] max-w-30 truncate">Desk</span>
      <span
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="ml-1 rounded p-0.5 hover:bg-muted"
      >
        <X size={12} />
      </span>
    </button>
  );
}
