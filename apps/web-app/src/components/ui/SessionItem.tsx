import type { ChatSession } from "@/types";
import { cn } from "@repo/ui/lib/utils";

interface SessionItemProps {
  session: ChatSession;
  onSelect: (session: ChatSession) => void;
}

export function SessionItem({ session, onSelect }: SessionItemProps) {
  return (
    <button
      onClick={() => onSelect(session)}
      className={cn(
        "shrink-0 truncate rounded-md px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
      )}
    >
      {session.title || "Untitled"}
    </button>
  );
}
