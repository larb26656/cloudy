import { useEffect, useState } from "react";
import { ArrowLeft, Settings2, Trash2, MoreHorizontal } from "lucide-react";
import type { Workspace } from "@/lib/cloudy/workspaces";
import { useDeleteWorkspace, useMarkWorkspaceActive } from "@/hooks/queries";
import { useNewChat } from "@/hooks/useNewChat";
import { Button } from "@repo/ui/components/button";
import { DeleteConfirmDialog } from "@repo/ui/components/delete-confirm-dialog";
import { WorkspaceDialog } from "@/features/workspace/WorkspaceDialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@repo/ui/components/dropdown-menu";
import { SessionList } from "./SessionList";
import { AgentProviderPicker } from "@/components/chat/AgentProviderPicker";

interface WorkspaceDetailProps {
  workspace: Workspace;
  onBack: () => void;
  backLabel?: string;
}

export function WorkspaceDetail({
  workspace,
  onBack,
  backLabel = "Back to Home",
}: WorkspaceDetailProps) {
  const deleteWorkspace = useDeleteWorkspace();
  const { mutate: markActive } = useMarkWorkspaceActive();
  const { create } = useNewChat();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    markActive(workspace.id);
  }, [markActive, workspace.id]);

  const handleNewChat = (providerId: string, agent: string) => {
    create({
      providerId,
      agent,
      workspaceId: workspace.id,
      directory: workspace.directory,
      sessionName: "New Chat",
    });
  };

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 flex items-center gap-2 self-start text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <span
            className="flex size-11 items-center justify-center rounded-xl text-base font-bold text-white shrink-0"
            style={{ backgroundColor: workspace.color }}
          >
            {workspace.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="text-[22px] font-bold leading-tight">
              {workspace.name}
            </h1>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground/80">
              {workspace.directory}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing(true)}>
              <Settings2 data-icon="inline-start" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleting(true)}
            >
              <Trash2 data-icon="inline-start" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SessionList
        directory={workspace.directory}
        workspaceId={workspace.id}
        workspaceType={workspace.type}
        header={
          <AgentProviderPicker
            label={workspace.type === "bot" ? "New bot chat" : "New chat"}
            onSelect={handleNewChat}
          />
        }
      />

      <WorkspaceDialog
        open={editing}
        onOpenChange={setEditing}
        workspace={workspace}
      />

      <DeleteConfirmDialog
        item={deleting ? { id: workspace.id, name: workspace.name } : null}
        onConfirm={() => {
          deleteWorkspace.mutate(workspace.id, {
            onSuccess: onBack,
          });
        }}
        onCancel={() => setDeleting(false)}
      />
    </div>
  );
}
