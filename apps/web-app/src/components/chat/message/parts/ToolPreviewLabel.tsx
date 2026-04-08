import type { ReactNode } from "react";

interface ToolPreviewLabelProps {
  icon: ReactNode;
  label: string;
  action?: ReactNode;
}

export function ToolPreviewLabel({
  icon,
  label,
  action,
}: ToolPreviewLabelProps) {
  return (
    <div className="flex items-start justify-between gap-2 text-xs text-muted-foreground">
      <div className="flex items-start gap-1.5 min-w-0">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
