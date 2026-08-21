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
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { QuickPathSection } from "./QuickPathSection";
import { WorkspaceSelectStep } from "@/features/workspace/WorkspaceSelectStep";
import type { Workspace } from "@/lib/cloudy/workspaces";
import { basename } from "@/lib/path";
import { useRecentDirectoryStore } from "@/stores/recentDirectoryStore";
import { useSessions } from "@/hooks/queries";

interface CreateChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    workspaceId: string | null;
    directory: string;
    sessionId: string | null;
    sessionName: string;
  }) => void;
}

/** Directory the chat will run in — a registered workspace or an ad-hoc path. */
interface ChatTarget {
  workspaceId: string | null;
  directory: string;
  name: string;
}

export function CreateChatDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateChatDialogProps) {
  const navigate = useNavigate();
  const pushRecentDirectory = useRecentDirectoryStore((s) => s.push);
  const [selected, setSelected] = useState<ChatTarget | null>(null);

  const { data: sessions = [], isLoading: sessionsLoading } = useSessions({
    directory: selected?.directory ?? "",
  });

  const handleQuickPath = (directory: string) => {
    pushRecentDirectory(directory);
    setSelected({
      workspaceId: null,
      directory,
      name: basename(directory) || directory,
    });
  };

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setSelected({
      workspaceId: workspace.id,
      directory: workspace.directory,
      name: workspace.name,
    });
  };

  const handleBack = () => {
    setSelected(null);
  };

  const resolveSession = (sessionId: string | null, sessionName: string) => {
    if (!selected) return;
    onSubmit({
      workspaceId: selected.workspaceId,
      directory: selected.directory,
      sessionId,
      sessionName,
    });
    handleClose();
  };

  const handleNewChat = () => resolveSession(null, "New Chat");

  const handleSessionSelect = (session: Session) =>
    resolveSession(session.id, session.title || "New Chat");

  const handleClose = () => {
    setSelected(null);
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
            {selected ? `Sessions in ${selected.name}` : "New Chat"}
          </DialogTitle>
          <DialogDescription>
            {selected
              ? "Choose a session or start a new chat"
              : "Start from any directory path or a registered workspace"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex-1 min-h-0 flex flex-col">
          {!selected ? (
            <>
              <QuickPathSection onPathSubmit={handleQuickPath} />
              <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or choose a workspace
                <span className="h-px flex-1 bg-border" />
              </div>
              <WorkspaceSelectStep
                onSelect={handleWorkspaceSelect}
                onGoToWorkspaces={handleGoToWorkspaces}
              />
            </>
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
  onSelect,
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
        <LoadingState
          size="inline"
          title="Loading sessions..."
          spinner={false}
        />
      ) : rootSessions.length === 0 ? (
        <EmptyState size="inline" title="No sessions in this workspace" />
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

      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="self-start -ml-2 shrink-0"
      >
        Back
      </Button>
    </div>
  );
}
