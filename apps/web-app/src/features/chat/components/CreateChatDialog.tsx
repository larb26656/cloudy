import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { ChatSession } from "@/types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { SessionItem } from "@/components/ui/SessionItem";
import { EmptyState } from "@repo/ui/components/empty-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import { QuickPathSection } from "./QuickPathSection";
import { WorkspaceSelectStep } from "@/features/workspace/WorkspaceSelectStep";
import type { Workspace } from "@/lib/cloudy/workspaces";
import { basename } from "@/lib/path";
import { useRecentDirectoryStore } from "@/stores/recentDirectoryStore";
import { useDefaultProviderStore } from "@/stores/defaultProviderStore";
import { useCreateTempWorkspace, useSessions } from "@/hooks/queries";
import { ArrowLeft, MessageCircleDashed } from "lucide-react";
import { ProviderSelector } from "@/components/chat/ProviderSelector";

interface CreateChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    workspaceId: string | null;
    directory: string;
    sessionId: string | null;
    sessionName: string;
    providerId: string;
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
  const defaultProviderId = useDefaultProviderStore((s) => s.defaultProviderId);
  const [selected, setSelected] = useState<ChatTarget | null>(null);
  const [providerId, setProviderId] = useState(defaultProviderId);
  const createTempWorkspace = useCreateTempWorkspace();

  const { data: sessions = [], isLoading: sessionsLoading } = useSessions({
    directory: selected?.directory ?? "",
  });

  const handleCreateTempChat = () => {
    createTempWorkspace.mutate(undefined, {
      onSuccess: ({ name, directory }) => {
        pushRecentDirectory(directory);
        onSubmit({
          workspaceId: null,
          directory,
          sessionId: null,
          sessionName: name,
          providerId,
        });
        handleClose();
      },
    });
  };

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
      providerId,
    });
    handleClose();
  };

  const handleNewChat = () => resolveSession(null, "New Chat");

  const handleSessionSelect = (session: ChatSession) =>
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
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="gap-1">
          <DialogTitle>
            {selected ? `Sessions in ${selected.name}` : "New Chat"}
          </DialogTitle>
          <DialogDescription>
            {selected
              ? "Choose a session or start a new chat"
              : "Start from any directory path or a registered workspace"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 py-5">
          {!selected ? (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium">Use a directory</h3>
                    <p className="text-xs text-muted-foreground">
                      Start a chat in a local project folder.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={handleCreateTempChat}
                    disabled={createTempWorkspace.isPending}
                  >
                    <MessageCircleDashed /> Temp chat
                  </Button>
                </div>
              </div>
              <QuickPathSection onPathSubmit={handleQuickPath} />
              <div className="flex items-end justify-between gap-3 border-t pt-4">
                <div>
                  <h3 className="text-sm font-medium">Registered workspaces</h3>
                  <p className="text-xs text-muted-foreground">
                    Continue in a workspace you already set up.
                  </p>
                </div>
              </div>
              <WorkspaceSelectStep
                onSelect={handleWorkspaceSelect}
                onGoToWorkspaces={handleGoToWorkspaces}
                workspaceType="agent"
              />
            </>
          ) : (
            <SessionStep
              providerId={providerId}
              onProviderChange={(value) => {
                if (value) setProviderId(value);
              }}
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
  providerId,
  onProviderChange,
  sessions,
  isLoading,
  onBack,
  onNewChat,
  onSelect,
}: {
  providerId: string;
  onProviderChange: (providerId: string) => void;
  sessions: ChatSession[];
  isLoading: boolean;
  onBack: () => void;
  onNewChat: () => void;
  onSelect: (session: ChatSession) => void;
}) {
  const rootSessions = sessions.filter(
    (session) => !session.parentID && session.providerId === providerId,
  );

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="space-y-2">
        <p className="text-sm font-medium">Execution provider</p>
        <ProviderSelector providerId={providerId} onChange={onProviderChange} />
      </div>
      <Button
        variant="outline"
        className="justify-start gap-2 shrink-0"
        onClick={onNewChat}
      >
        <MessageCircleDashed />
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
        <ArrowLeft />
        Back
      </Button>
    </div>
  );
}
