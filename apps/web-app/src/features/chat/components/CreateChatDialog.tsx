import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { ChatSession } from "@/types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useSessions } from "@/hooks/queries";
import { useNewChat } from "@/hooks/useNewChat";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Folder,
  FolderOpen,
  LoaderCircle,
  MessageCircleDashed,
} from "lucide-react";
import { ProviderSelector } from "@/components/chat/ProviderSelector";
import { useCapacity } from "@/hooks/queries/useModels";

interface CreateChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    workspaceId: string | null;
    directory: string;
    sessionId: string | null;
    sessionName: string;
    providerId: string;
    agent?: string | null;
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
  const [directoryChoice, setDirectoryChoice] = useState<
    "workspace" | "path" | null
  >(null);
  const [providerId, setProviderId] = useState(defaultProviderId);
  const [agentId, setAgentId] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setProviderId(defaultProviderId);
      setAgentId(null);
    }
  }, [open, defaultProviderId]);
  const { createTemp, isCreatingTemp } = useNewChat();
  const { data: capacity } = useCapacity(providerId);
  const requiresDirectory = capacity?.requiresDirectory ?? true;

  const { data: sessions = [], isLoading: sessionsLoading } = useSessions({
    directory: selected?.directory ?? "",
  });

  const handleCreateTempChat = () => {
    createTemp({
      providerId,
      agent: agentId,
      onCreated: ({ directory, sessionName }) => {
        onSubmit({
          workspaceId: null,
          directory,
          sessionId: null,
          sessionName,
          providerId,
          agent: agentId,
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
    setDirectoryChoice(null);
  };

  const resolveSession = (sessionId: string | null, sessionName: string) => {
    if (!selected) return;
    onSubmit({
      workspaceId: selected.workspaceId,
      directory: selected.directory,
      sessionId,
      sessionName,
      providerId,
      agent: agentId,
    });
    handleClose();
  };

  const handleNewChat = () => resolveSession(null, "New Chat");

  const handleDirectorylessChat = () => {
    onSubmit({
      workspaceId: null,
      directory: "",
      sessionId: null,
      sessionName: "New Chat",
      providerId,
      agent: agentId,
    });
    handleClose();
  };

  const handleSessionSelect = (session: ChatSession) =>
    resolveSession(session.id, session.title || "New Chat");

  const handleClose = () => {
    setSelected(null);
    setDirectoryChoice(null);
    onOpenChange(false);
  };

  const handleGoToWorkspaces = () => {
    handleClose();
    navigate({ to: "/" });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[85vh] min-h-[440px] flex-col overflow-hidden p-6 sm:max-w-md">
        <DialogHeader className="space-y-0">
          <div className="flex items-center gap-2">
            {directoryChoice && !selected && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="-ml-2"
                aria-label="Back"
                onClick={handleBack}
              >
                <ArrowLeft />
              </Button>
            )}
            <DialogTitle className="text-base">
              {selected ? `Sessions in ${selected.name}` : "New Chat"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 pt-5">
          {!selected ? (
            <>
              {!directoryChoice && (
                <section className="space-y-2">
                  <h3 className="text-sm font-medium">Select provider</h3>
                  <ProviderSelector
                    providerId={providerId}
                    onChange={(value) => {
                      if (value) setProviderId(value);
                    }}
                    triggerClassName="h-10 w-full justify-start rounded-lg border bg-muted/30 px-3 [&>svg:last-child]:ml-auto"
                  />
                </section>
              )}

              {!requiresDirectory ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-5 py-2 text-center">
                  <ChatReadyIllustration />
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold">Ready to chat</h3>
                    <p className="max-w-xs text-sm leading-5 text-muted-foreground">
                      This provider doesn’t use a project directory.
                      <br />
                      Just start chatting.
                    </p>
                  </div>
                  <Button
                    className="mt-auto w-full gap-2"
                    onClick={handleDirectorylessChat}
                  >
                    Start Chat <ArrowRight data-icon="inline-end" />
                  </Button>
                </div>
              ) : directoryChoice ? (
                <>
                  {directoryChoice === "workspace" ? (
                    <div className="flex min-h-0 flex-1 flex-col gap-3">
                      <h3 className="text-sm font-medium">
                        Choose a workspace
                      </h3>
                      <WorkspaceSelectStep
                        onSelect={handleWorkspaceSelect}
                        onGoToWorkspaces={handleGoToWorkspaces}
                        workspaceType="agent"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col gap-3">
                      <h3 className="text-sm font-medium">Open by path</h3>
                      <p className="text-xs text-muted-foreground">
                        Enter an absolute project directory path.
                      </p>
                      <QuickPathSection onPathSubmit={handleQuickPath} />
                    </div>
                  )}
                </>
              ) : (
                <section className="flex flex-1 flex-col gap-2">
                  <h3 className="text-sm font-medium">
                    Choose project directory
                  </h3>
                  <ChoiceButton
                    icon={FolderOpen}
                    title="Use existing workspace"
                    description="Continue in a registered project"
                    onClick={() => setDirectoryChoice("workspace")}
                  />
                  <ChoiceButton
                    icon={Folder}
                    title="Open by path"
                    description="Enter an absolute directory path"
                    onClick={() => setDirectoryChoice("path")}
                  />
                  <ChoiceButton
                    icon={LoaderCircle}
                    title="Create temporary workspace"
                    description="Auto-create a temporary directory"
                    onClick={handleCreateTempChat}
                    disabled={isCreatingTemp}
                  />
                </section>
              )}
            </>
          ) : (
            <SessionStep
              providerId={providerId}
              sessions={sessions}
              isLoading={sessionsLoading}
              onNewChat={handleNewChat}
              onSelect={handleSessionSelect}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChoiceButton({
  icon: Icon,
  title,
  description,
  onClick,
  disabled = false,
}: {
  icon: typeof FolderOpen;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex min-h-[66px] items-center gap-3 rounded-lg border bg-card px-3 text-left transition-colors hover:border-primary/60 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
      {disabled ? (
        <span className="text-xs text-muted-foreground">Creating…</span>
      ) : (
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      )}
    </button>
  );
}

function ChatReadyIllustration() {
  return (
    <div aria-hidden="true" className="relative h-28 w-40">
      <div className="absolute left-1 top-8 h-12 w-20 rounded-lg rounded-bl-sm bg-muted p-2.5">
        <span className="mb-1.5 block h-1 w-10 rounded-full bg-muted-foreground/40" />
        <span className="block h-1 w-14 rounded-full bg-muted-foreground/30" />
      </div>
      <div className="absolute right-0 top-1 h-9 w-16 rounded-lg rounded-br-sm bg-muted/80 p-2">
        <span className="mb-1 block h-1 w-8 rounded-full bg-muted-foreground/40" />
        <span className="block h-1 w-11 rounded-full bg-muted-foreground/30" />
      </div>
      <div className="absolute bottom-0 right-1 h-12 w-20 rounded-lg rounded-br-sm bg-primary p-2.5">
        <span className="mb-1.5 block h-1 w-10 rounded-full bg-primary-foreground/75" />
        <span className="block h-1 w-14 rounded-full bg-primary-foreground/55" />
      </div>
    </div>
  );
}

function SessionStep({
  providerId,
  sessions,
  isLoading,
  onNewChat,
  onSelect,
}: {
  providerId: string;
  sessions: ChatSession[];
  isLoading: boolean;
  onNewChat: () => void;
  onSelect: (session: ChatSession) => void;
}) {
  const rootSessions = sessions.filter(
    (session) => !session.parentID && session.providerId === providerId,
  );

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
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
    </div>
  );
}
