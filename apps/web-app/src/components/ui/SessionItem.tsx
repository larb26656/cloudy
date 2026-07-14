import type { Session } from "@opencode-ai/sdk/v2";
import { cn } from "@/lib/utils";

interface SessionItemProps {
  session: Session;
  onSelect: (session: Session) => void;
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
