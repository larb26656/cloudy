import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Session } from "@opencode-ai/sdk/v2";
import { FolderOpen } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WorkspaceItem } from "@/components/ui/WorkspaceItem";
import { SessionItem } from "@/components/ui/SessionItem";
import { useWorkspaceStore, type Workspace } from "@/stores/workspaceStore";
import { useSessions } from "@/hooks/queries";
import { useTabStore } from "@/stores/tabStore";

interface CreateChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (data: {
    directory: string;
    sessionId: string | null;
    sessionName: string;
  }) => void;
}

export function CreateChatDialog({ open, onOpenChange, onCreated }: CreateChatDialogProps) {
  const navigate = useNavigate();
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const addTab = useTabStore((s) => s.addTab);

  const { data: sessions = [], isLoading: sessionsLoading } = useSessions({
    directory: selectedWorkspace?.directory ?? "",
  });

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
  };

  const handleBack = () => {
    setSelectedWorkspace(null);
  };

  const handleNewChat = async () => {
    if (!selectedWorkspace) return;

    if (onCreated) {
      onCreated({
        directory: selectedWorkspace.directory,
        sessionId: null,
        sessionName: "New Chat",
      });
    } else {
      addTab("session", {
        sessionId: null,
        workspaceId: selectedWorkspace.id,
        sessionName: "New Chat",
      });
    }

    handleClose();
  };

  const handleSessionSelect = (session: Session) => {
    if (!selectedWorkspace) return;
    if (onCreated) {
      onCreated({
        directory: selectedWorkspace.directory,
        sessionId: session.id,
        sessionName: session.title || "New Chat",
      });
    } else {
      addTab("session", {
        sessionId: session.id,
        workspaceId: selectedWorkspace.id,
        sessionName: session.title || "New Chat",
      });
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedWorkspace(null);
    onOpenChange(false);
  };

  const handleGoToWorkspaces = () => {
    handleClose();
    navigate({ to: "/" });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {selectedWorkspace ? `Sessions in ${selectedWorkspace.name}` : "Select Workspace"}
          </DialogTitle>
          <DialogDescription>
            {selectedWorkspace
              ? "Choose a session or start a new chat"
              : "Choose a workspace to create a new chat"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex-1 min-h-0 flex flex-col">
          {!selectedWorkspace ? (
            <WorkspaceStep
              workspaces={workspaces}
              onSelect={handleWorkspaceSelect}
              onGoToWorkspaces={handleGoToWorkspaces}
            />
          ) : (
            <SessionStep
              sessions={sessions}
              isLoading={sessionsLoading}
              onBack={handleBack}
              onNewChat={handleNewChat}
              onSelect={handleSessionSelect}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WorkspaceStep({
  workspaces,
  onSelect,
  onGoToWorkspaces,
}: {
  workspaces: Workspace[];
  onSelect: (workspace: Workspace) => void;
  onGoToWorkspaces: () => void;
}) {
  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <FolderOpen className="size-12 text-muted-foreground" />
        <div>
          <p className="font-medium">No workspaces yet</p>
          <p className="text-sm text-muted-foreground">
            Create a workspace first to start chatting
          </p>
        </div>
        <Button onClick={onGoToWorkspaces}>Go to Workspaces</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
      {workspaces.map((workspace) => (
        <WorkspaceItem
          key={workspace.id}
          workspace={workspace}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function SessionStep({
  sessions,
  isLoading,
  onBack,
  onNewChat,
  onSelect
}: {
  sessions: Session[];
  isLoading: boolean;
  onBack: () => void;
  onNewChat: () => void;
  onSelect: (session: Session) => void;
}) {
  const rootSessions = sessions.filter((s) => !s.parentID);

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <Button
        variant="outline"
        className="justify-start gap-2 shrink-0"
        onClick={onNewChat}
      >
        <span data-icon="inline_start">+</span>
        New Chat
      </Button>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading sessions...</p>
      ) : rootSessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sessions in this workspace</p>
      ) : (
        <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
          {rootSessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

      <Button variant="ghost" size="sm" onClick={onBack} className="self-start -ml-2 shrink-0">
        Back to workspaces
      </Button>
    </div>
  );
}
