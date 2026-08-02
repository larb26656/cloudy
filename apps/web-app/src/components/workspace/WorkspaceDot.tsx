import { useWorkspace } from "@/hooks/queries";
import { cn } from "@/lib/utils";

interface WorkspaceDotProps {
  workspaceId: string | undefined;
  className?: string;
}

export function WorkspaceDot({ workspaceId, className }: WorkspaceDotProps) {
  const { data: workspace } = useWorkspace(workspaceId ?? null);
  const color = workspace?.color;

  if (!color) return null;

  return (
    <span
      className={cn("size-2 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color }}
    />
  );
}
