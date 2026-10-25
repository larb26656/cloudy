import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Search,
  Settings2,
  Trash2,
  MoreHorizontal,
  Plus,
} from "lucide-react";
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
import { ProviderSelector } from "@/components/chat/ProviderSelector";
import { useDefaultProviderStore } from "@/stores/defaultProviderStore";
import { Input } from "@repo/ui/components/input";

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
  const defaultProviderId = useDefaultProviderStore((s) => s.defaultProviderId);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [providerId, setProviderId] = useState(defaultProviderId);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    markActive(workspace.id);
  }, [markActive, workspace.id]);

  const handleNewChat = () => {
    create({
      providerId,
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
        search={search}
        header={
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ProviderSelector
                providerId={providerId}
                variant="chat"
                onChange={setProviderId}
              />
              <Button
                variant="secondary"
                size="sm"
                className="h-10 gap-2 rounded-lg px-3"
                onClick={() => setSearchOpen((open) => !open)}
                aria-expanded={searchOpen}
              >
                <Search data-icon="inline-start" />
                Search
              </Button>
              <Button
                variant="default"
                size="sm"
                className="ml-auto h-10 rounded-lg px-4"
                onClick={handleNewChat}
              >
                <Plus data-icon="inline-start" />
                New chat
              </Button>
            </div>
            {searchOpen && (
              <Input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search chats..."
                aria-label="Search chats"
              />
            )}
          </div>
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
