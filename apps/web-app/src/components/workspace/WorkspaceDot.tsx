import { useWorkspaceStore } from "@/stores/workspaceStore";
import { cn } from "@/lib/utils";

interface WorkspaceDotProps {
  workspaceId: string | undefined;
  className?: string;
}

export function WorkspaceDot({ workspaceId, className }: WorkspaceDotProps) {
  const color = useWorkspaceStore((s) =>
    workspaceId ? s.getWorkspace(workspaceId)?.color : undefined,
  );

  if (!color) return null;

  return (
    <span
      className={cn("size-2 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color }}
    />
  );
}
