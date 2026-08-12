import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Clock3, FolderOpen, SquareTerminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkspaceSelectStep } from "@/features/workspace/WorkspaceSelectStep";
import { usePtySessions } from "@/hooks/queries";
import type { PtySession } from "@/hooks/queries";
import { formatRelativeFromTimestamp } from "@/lib/format";

export interface TerminalDialogResult {
  directory: string;
  ptyId: string | null;
}

interface TerminalWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (result: TerminalDialogResult) => void;
}

export function isAbsoluteDirectory(value: string): boolean {
  return value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value);
}

export function TerminalWorkspaceDialog({
  open,
  onOpenChange,
  onSubmit,
}: TerminalWorkspaceDialogProps) {
  const navigate = useNavigate();
  const { data: sessions = [], isLoading, error } = usePtySessions();
  const [directory, setDirectory] = useState("");
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<PtySession | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("new");

  useEffect(() => {
    if (!open) return;
    setActiveTab("new");
    setSelectedSession(null);
  }, [open]);

  const close = () => onOpenChange(false);
  const submit = (result: TerminalDialogResult) => {
    onSubmit(result);
    close();
  };

  const submitDirectory = () => {
    const value = directory.trim();
    if (!isAbsoluteDirectory(value)) {
      setDirectoryError("Enter an absolute directory path");
      return;
    }
    submit({ directory: value, ptyId: null });
  };

  const runningSessions = sessions.filter((session) => session.alive);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create terminal</DialogTitle>
            <DialogDescription>
              Start in a directory or reconnect to a running shell
            </DialogDescription>
          </DialogHeader>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="min-h-0 flex-1"
          >
            <TabsList variant="line" className="w-full">
              <TabsTrigger value="new">New terminal</TabsTrigger>
              <TabsTrigger value="existing">Existing session</TabsTrigger>
            </TabsList>
            <TabsContent value="new" className="min-h-0 overflow-y-auto pt-3">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <FolderOpen className="size-3.5" />
                Registered workspaces
              </div>
              <WorkspaceSelectStep
                onSelect={(workspace) =>
                  submit({ directory: workspace.directory, ptyId: null })
                }
                onGoToWorkspaces={() => {
                  close();
                  navigate({ to: "/" });
                }}
              />
              <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or enter a path
                <span className="h-px flex-1 bg-border" />
              </div>
              <form
                className="flex items-start gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitDirectory();
                }}
              >
                <div className="min-w-0 flex-1">
                  <Input
                    value={directory}
                    placeholder="/absolute/path/to/project"
                    aria-label="Terminal directory"
                    aria-invalid={!!directoryError}
                    className="font-mono text-sm"
                    onChange={(event) => {
                      setDirectory(event.target.value);
                      setDirectoryError(null);
                    }}
                  />
                  {directoryError && (
                    <p className="mt-1 text-xs text-destructive">
                      {directoryError}
                    </p>
                  )}
                </div>
                <Button type="submit">Create</Button>
              </form>
            </TabsContent>
            <TabsContent
              value="existing"
              className="min-h-0 overflow-y-auto pt-3"
            >
              {isLoading ? (
                <LoadingState
                  size="inline"
                  title="Loading terminals..."
                  spinner={false}
                />
              ) : error ? (
                <ErrorState
                  size="inline"
                  bare
                  message="Failed to load terminals"
                />
              ) : runningSessions.length === 0 ? (
                <EmptyState
                  size="inline"
                  icon={SquareTerminal}
                  title="No running terminals"
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border">
                  {runningSessions.map((session, index) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => setSelectedSession(session)}
                      className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/60 ${index > 0 ? "border-t border-border" : ""}`}
                    >
                      <SquareTerminal className="size-4 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {session.name}
                        </span>
                        <span className="block truncate font-mono text-[11px] text-muted-foreground">
                          {session.directory}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock3 className="size-3" />
                        {formatRelativeFromTimestamp(session.lastActivityAt)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={selectedSession !== null}
        onOpenChange={(nextOpen) => !nextOpen && setSelectedSession(null)}
        title="Attach running terminal?"
        description="This terminal may already be open elsewhere. Closing either view can stop the shared shell for every view."
        confirmLabel="Attach session"
        onConfirm={() => {
          if (!selectedSession) return;
          submit({
            directory: selectedSession.directory,
            ptyId: selectedSession.id,
          });
          setSelectedSession(null);
        }}
      />
    </>
  );
}
