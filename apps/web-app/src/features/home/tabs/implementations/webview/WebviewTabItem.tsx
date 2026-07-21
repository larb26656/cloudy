import { Globe, X } from "lucide-react";
import type { Tab } from "@/stores/tabStore";
import { cn } from "@/lib/utils";

interface WebviewTabItemProps {
  tab: Extract<Tab, { type: "webview" }>;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

export function WebviewTabItem({
  tab,
  isActive,
  onClick,
  onClose,
}: WebviewTabItemProps) {
  const hostname = (() => {
    try {
      return new URL(tab.data.url).hostname;
    } catch {
      return tab.data.url;
    }
  })();

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
        <Globe />
      </span>
      <span className="text-[13px] max-w-30 truncate">{hostname}</span>
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
