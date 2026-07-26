import { MessageCircle, X } from "lucide-react";
import { useSession } from "@/hooks/queries/useSessions";
import type { Tab } from "@/features/home/tabs/template";
import type { SessionData } from "./meta";
import { cn } from "@/lib/utils";

interface SessionTabItemProps {
  tab: Extract<Tab, { type: "session" }>;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

export function SessionTabItem({
  tab,
  isActive,
  onClick,
  onClose,
}: SessionTabItemProps) {
  const { data: session } = useSession({
    sessionId: tab.data.sessionId,
  });
  const displayName = session?.title ?? tab.data.sessionName ?? "New Chat";

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
        <MessageCircle />
      </span>
      <span className="text-[13px] max-w-30 truncate">{displayName}</span>
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

export type { SessionData };
