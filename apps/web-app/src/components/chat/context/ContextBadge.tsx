import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useContextStore } from "@/stores/contextStore";
import type { ContextItem } from "@/types/context";

interface ContextBadgeProps {
  item: ContextItem;
}

export function ContextBadge({ item }: ContextBadgeProps) {
  const removeContext = useContextStore((s) => s.removeContext);

  const label =
    typeof item.data === "object" && item.data !== null && "label" in item.data
      ? String((item.data as { label: string }).label)
      : item.type;

  const handleRemove = () => {
    removeContext(item.id);
    window.electronAPI?.context.removeContext(item.id);
  };

  return (
    <Badge variant="info" className="gap-1 pr-1 px-2 py-3">
      <span className="truncate max-w-[150px]">{label}</span>
      <button
        type="button"
        onClick={handleRemove}
        className="inline-flex items-center justify-center size-3.5 rounded-full hover:bg-foreground/10"
      >
        <X className="size-3" />
      </button>
    </Badge>
  );
}
