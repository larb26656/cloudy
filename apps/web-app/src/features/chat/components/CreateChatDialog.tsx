import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Session } from "@opencode-ai/sdk/v2";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SessionItem } from "@/components/ui/SessionItem";
import { WorkspaceSelectStep } from "@/features/workspace/WorkspaceSelectStep";
import type { Workspace } from "@/stores/workspaceStore";
import { useSessions } from "@/hooks/queries";

interface CreateChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    workspaceId: string;
    sessionId: string | null;
    sessionName: string;
  }) => void;
}

export function CreateChatDialog({ open, onOpenChange, onSubmit }: CreateChatDialogProps) {
  const navigate = useNavigate();
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

  const { data: sessions = [], isLoading: sessionsLoading } = useSessions({
    directory: selectedWorkspace?.directory ?? "",
  });

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
  };

  const handleBack = () => {
    setSelectedWorkspace(null);
  };

  const resolveSession = (sessionId: string | null, sessionName: string) => {
    if (!selectedWorkspace) return;
    onSubmit({
      workspaceId: selectedWorkspace.id,
      sessionId,
      sessionName,
    });
    handleClose();
  };

  const handleNewChat = () => resolveSession(null, "New Chat");

  const handleSessionSelect = (session: Session) =>
    resolveSession(session.id, session.title || "New Chat");

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
            <WorkspaceSelectStep
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
