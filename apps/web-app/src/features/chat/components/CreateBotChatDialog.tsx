import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Session } from "@opencode-ai/sdk/v2";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { LoadingState } from "@repo/ui/components/loading-state";
import { SessionItem } from "@/components/ui/SessionItem";
import { WorkspaceSelectStep } from "@/features/workspace/WorkspaceSelectStep";
import { useSessions } from "@/hooks/queries";
import type { Workspace } from "@/lib/cloudy/workspaces";

interface CreateBotChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    workspaceId: string;
    directory: string;
    sessionId: string | null;
    sessionName: string;
  }) => void;
}

export function CreateBotChatDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateBotChatDialogProps) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Workspace | null>(null);
  const { data: sessions = [], isLoading } = useSessions({
    directory: selected?.directory ?? "",
  });

  const handleClose = () => {
    setSelected(null);
    onOpenChange(false);
  };

  const resolveSession = (sessionId: string | null, sessionName: string) => {
    if (!selected) return;
    onSubmit({
      workspaceId: selected.id,
      directory: selected.directory,
      sessionId,
      sessionName,
    });
    handleClose();
  };

  const rootSessions = sessions.filter((session) => !session.parentID);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {selected ? `Sessions in ${selected.name}` : "New Bot Chat"}
          </DialogTitle>
          <DialogDescription>
            {selected
              ? "Choose a session or start a new bot chat"
              : "Choose a bot workspace"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex-1 min-h-0 flex flex-col">
          {!selected ? (
            <WorkspaceSelectStep
              workspaceType="bot"
              onSelect={setSelected}
              onGoToWorkspaces={() => {
                handleClose();
                navigate({ to: "/" });
              }}
            />
          ) : (
            <div className="flex flex-col gap-4 flex-1 min-h-0">
              <Button
                variant="outline"
                className="justify-start gap-2 shrink-0"
                onClick={() => resolveSession(null, "New Bot Chat")}
              >
                <span data-icon="inline_start">+</span>
                New Bot Chat
              </Button>

              {isLoading ? (
                <LoadingState
                  size="inline"
                  title="Loading sessions..."
                  spinner={false}
                />
              ) : rootSessions.length === 0 ? (
                <EmptyState
                  size="inline"
                  title="No sessions in this workspace"
                />
              ) : (
                <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
                  {rootSessions.map((session: Session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      onSelect={(next) =>
                        resolveSession(next.id, next.title || "New Bot Chat")
                      }
                    />
                  ))}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelected(null)}
                className="self-start -ml-2 shrink-0"
              >
                Back
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
