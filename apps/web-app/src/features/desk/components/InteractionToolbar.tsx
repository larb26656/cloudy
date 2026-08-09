import { Hand, MousePointer2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DeskPanel } from "./DeskPanel";
import type { InteractionMode } from "../hooks/useInteractionMode";

interface InteractionToolbarProps {
  mode: InteractionMode;
  setMode: (mode: InteractionMode) => void;
  /** True while Space is being held, to hint the transient override. */
  spaceHeld?: boolean;
}

const TOOLS: {
  mode: InteractionMode;
  icon: LucideIcon;
  label: string;
  hint: string;
}[] = [
  { mode: "select", icon: MousePointer2, label: "Select", hint: "V" },
  { mode: "hand", icon: Hand, label: "Hand / Pan", hint: "H" },
];

export function InteractionToolbar({
  mode,
  setMode,
  spaceHeld = false,
}: InteractionToolbarProps) {
  return (
    <DeskPanel>
      {TOOLS.map((tool) => {
        const active = mode === tool.mode;
        const Icon = tool.icon;
        const overridden = active && spaceHeld;
        return (
          <Tooltip key={tool.mode}>
            <TooltipTrigger
              render={
                <Button
                  variant={active ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={(e) => {
                    setMode(tool.mode);
                    e.currentTarget.blur();
                  }}
                  aria-pressed={active}
                  className={cn(overridden && "opacity-60")}
                >
                  <Icon className="size-4" />
                </Button>
              }
            />
            <TooltipContent>
              {tool.label} ({tool.hint})
            </TooltipContent>
          </Tooltip>
        );
      })}
    </DeskPanel>
  );
}
