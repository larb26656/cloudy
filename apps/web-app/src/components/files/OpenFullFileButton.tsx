import type { VcsFileDiff } from "@opencode-ai/sdk/v2";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OpenFullFileButtonProps {
  path: string;
  status: VcsFileDiff["status"];
  onOpen: (path: string) => void;
  className?: string;
}

export function OpenFullFileButton({
  path,
  status,
  onOpen,
  className,
}: OpenFullFileButtonProps) {
  if (status === "deleted") return null;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            className={className}
            onClick={() => onOpen(path)}
            aria-label={`Open full file: ${path}`}
          >
            <Maximize2 data-icon="inline-start" />
          </Button>
        }
      />
      <TooltipContent>Open full file</TooltipContent>
    </Tooltip>
  );
}
