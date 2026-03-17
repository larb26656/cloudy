import type { ReactNode } from "react";

interface ToolPreviewLabelProps {
  icon: ReactNode;
  label: string;
}

export function ToolPreviewLabel({ icon, label }: ToolPreviewLabelProps) {
  return (
    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
