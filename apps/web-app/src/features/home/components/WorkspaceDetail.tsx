import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Settings2,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import type { Workspace } from "@/lib/cloudy/workspaces";
import { useDeleteWorkspace } from "@/hooks/queries";
import { useTabStore } from "@/stores/tabStore";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { WorkspaceDialog } from "@/features/workspace/WorkspaceDialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SessionList } from "./SessionList";

interface WorkspaceDetailProps {
  workspace: Workspace;
  onBack: () => void;
}

export function WorkspaceDetail({ workspace, onBack }: WorkspaceDetailProps) {
  const deleteWorkspace = useDeleteWorkspace();
  const addTab = useTabStore((s) => s.addTab);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleNewChat = () => {
    addTab("chat", {
      sessionId: null,
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
        Back to Home
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <span
            className="flex size-11 items-center justify-center rounded-xl text-base font-bold text-white"
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
        header={
          <Button
            variant="default"
            size="sm"
            className="self-start gap-1.5"
            onClick={handleNewChat}
          >
            <Plus data-icon="inline-start" />
            New chat
          </Button>
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
