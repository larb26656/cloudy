import type { Workspace } from "@/lib/cloudy/workspaces";

interface WorkspaceItemProps {
  workspace: Workspace;
  onSelect: (workspace: Workspace) => void;
}

export function WorkspaceItem({ workspace, onSelect }: WorkspaceItemProps) {
  return (
    <button
      onClick={() => onSelect(workspace)}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
    >
      <span
        className="size-3 shrink-0 rounded-full"
        style={{ backgroundColor: workspace.color }}
      />
      <span className="truncate">{workspace.name}</span>
    </button>
  );
}
