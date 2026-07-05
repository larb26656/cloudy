import { PanelLeftClose, PanelLeft } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

export function SidebarToggle() {
  const [open, setOpen] = useState(true);

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-md hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
      >
        {open ? (
          <PanelLeftClose className="size-5" />
        ) : (
          <PanelLeft className="size-5" />
        )}
      </TooltipTrigger>
      <TooltipContent>
        {open ? "Close sidebar" : "Open sidebar"} (Cmd+B)
      </TooltipContent>
    </Tooltip>
  );
}
