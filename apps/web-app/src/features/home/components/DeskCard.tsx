import { LayoutGrid } from "lucide-react";
import { formatRelativeFromTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tab } from "@/stores/tabStore";

interface DeskCardProps {
  tab: Tab;
  onClick: () => void;
}

export function DeskCard({ tab, onClick }: DeskCardProps) {
  const name = (tab.data as { name?: string }).name ?? "Untitled desk";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-[168px] shrink-0 flex-col rounded-xl border bg-card p-4 text-left",
        "transition-colors hover:border-foreground/20",
      )}
    >
      <span className="mb-3.5 flex size-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
        <LayoutGrid className="size-4" />
      </span>
      <span className="mb-1 text-[13.5px] font-semibold truncate">{name}</span>
      <span className="text-[11.5px] text-muted-foreground/80">
        {formatRelativeFromTimestamp(tab.updatedAt)}
      </span>
    </button>
  );
}
