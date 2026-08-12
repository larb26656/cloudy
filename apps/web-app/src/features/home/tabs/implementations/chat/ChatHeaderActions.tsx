import { PanelRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useChatPanelStore } from "@/stores/chatPanelStore";
import type { TabHeaderActionsProps } from "../../template";

export function ChatHeaderActions({ tab }: TabHeaderActionsProps) {
  const filesOpen = useChatPanelStore(
    (s) => s.filesOpenByTabId[tab.id] ?? false,
  );
  const toggleFiles = useChatPanelStore((s) => s.toggleFiles);

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={() => toggleFiles(tab.id)}
        aria-label="Toggle files panel"
        data-active={filesOpen ? "true" : undefined}
        className={cn(
          "inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer",
          filesOpen && "bg-muted text-foreground",
        )}
      >
        <PanelRight className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent>Toggle files panel</TooltipContent>
    </Tooltip>
  );
}
