import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@repo/ui/components/button";

interface CloseButtonWithIndicatorProps {
  onClick: () => void;
  "aria-label": string;
  indicator?: ReactNode;
  closeButton?: ReactNode;
  className?: string;
}

export function CloseButtonWithIndicator({
  onClick,
  "aria-label": ariaLabel,
  indicator,
  closeButton,
  className,
}: CloseButtonWithIndicatorProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={ariaLabel}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`group/closable-item relative text-muted-foreground hover:text-destructive focus-visible:text-destructive ${className ?? ""}`}
    >
      {indicator && (
        <span className="absolute inset-0 flex items-center justify-center transition-opacity group-hover/closable-item:opacity-0 group-focus-within/closable-item:opacity-0">
          {indicator}
        </span>
      )}
      <span
        className={
          indicator
            ? "opacity-0 transition-opacity group-hover/closable-item:opacity-100 group-focus-within/closable-item:opacity-100"
            : ""
        }
      >
        {closeButton ?? <X aria-hidden="true" className="size-3" />}
      </span>
    </Button>
  );
}
