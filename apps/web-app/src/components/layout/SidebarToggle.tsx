import {
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChatUIStore } from "@/stores";

export function SidebarToggle() {
  const { sidebarOpen, toggleSidebar } = useChatUIStore();

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={toggleSidebar}
        className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-md hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
      >
        {sidebarOpen ? (
          <PanelLeftClose className="size-5" />
        ) : (
          <PanelLeft className="size-5" />
        )}
      </TooltipTrigger>
      <TooltipContent>
        {sidebarOpen ? "Close sidebar" : "Open sidebar"} (Cmd+B)
      </TooltipContent>
    </Tooltip>
  );
}
