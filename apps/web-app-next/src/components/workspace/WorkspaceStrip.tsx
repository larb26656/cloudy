import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const MOCK_WORKSPACE = {
  id: "workspace-mock-0001",
  instanceId: "instance-mock-0001",
  name: "Mock",
  color: "#3B82F6" as const,
  directory: "/tmp/cloudy-mock",
  createdAt: Date.now(),
};

interface WorkspaceStripProps {
  instanceId: string;
  className?: string;
}

export function WorkspaceStrip({ instanceId, className }: WorkspaceStripProps) {
  void instanceId;
  const [selectedId, setSelectedId] = useState(MOCK_WORKSPACE.id);

  return (
    <>
      <div
        className={cn(
          "flex flex-col items-center w-[72px] h-full border-r bg-sidebar transition-colors rounded-l-0 md:rounded-l-2xl",
          className,
        )}
      >
        <div className="flex flex-col items-center flex-1 w-full py-3 gap-2 overflow-y-auto scrollbar-hidden">
          <button
            type="button"
            onClick={() => setSelectedId(MOCK_WORKSPACE.id)}
            className={`size-12 rounded-xl flex items-center justify-center text-sm font-semibold text-white transition-all duration-200 hover:rounded-[16px] ${
              selectedId === MOCK_WORKSPACE.id ? "ring-2 ring-primary" : ""
            }`}
            style={{ backgroundColor: MOCK_WORKSPACE.color }}
            title={MOCK_WORKSPACE.name}
          >
            {MOCK_WORKSPACE.name.charAt(0).toUpperCase()}
          </button>
        </div>

        <div className="pb-3">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  className="size-12 rounded-xl flex items-center justify-center bg-muted hover:bg-muted/80 transition-all duration-200 hover:rounded-[16px]"
                >
                  <Plus className="size-5 text-foreground" />
                </button>
              }
            />
            <TooltipContent side="right" sideOffset={8}>
              New workspace (mock)
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );
}
