import { MessageList } from "./message/MessageList";
import { SessionViewDialogContext } from "@repo/ui/components/message";
import { SessionViewDialog } from "./dialogs/SessionViewDialog";
import { ChatInput } from "./chat-input";
import { SessionStatusBar } from "./SessionStatusBar";
import { PermissionBanner } from "@/components/permission/PermissionBanner";
import { PermissionDialog } from "@/components/permission/PermissionDialog";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@repo/ui/lib/utils";
import { generatePlaceholder } from "@/lib/greeting-generator";
import { useSessionData } from "@/hooks/session/useSessionHumanApprove";
import { SessionPickerDialog } from "@/components/session/SessionPickerDialog";
import type { Workspace } from "@/lib/cloudy/workspaces";
import type { ModelInfo } from "@repo/contracts";
import { QuestionBanner } from "../question/QuestionBanner";
import { QuestionSheet } from "../question/QuestionSheet";
import { ChatProvider, useChat } from "./ChatProvider";
import { MessageScrollerProvider } from "@repo/ui/components/message-scroller";
import { AgentSelector } from "./AgentSelector";
import { useCapacity } from "@/hooks/queries/useModels";
import { LoadingState } from "@repo/ui/components/loading-state";
import { ErrorState } from "@repo/ui/components/error-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";

interface ChatContainerProps {
  workspace?: Workspace | null;
  directory: string;
  providerId: string;
  sessionId: string | null;
  onSessionChange?: (sessionId: string | null) => void;
  agent?: string | null;
  onAgentChange?: (agent: string | null) => void;
  model?: ModelInfo | null;
  onModelChange?: (model: ModelInfo | null) => void;
  readOnly?: boolean;
  topContent?: ReactNode;
}

export function ChatContainer({
  workspace = null,
  directory,
  providerId,
  sessionId,
  onSessionChange,
  agent,
  onAgentChange,
  model,
  onModelChange,
  readOnly = false,
  topContent,
}: ChatContainerProps) {
  const chatplaceholder = useMemo(() => generatePlaceholder(), []);
  const { data: capacity, isLoading, error } = useCapacity(providerId);
  if (isLoading) return <LoadingState />;
  if (error || !capacity)
    return <ErrorState message={error?.message ?? "Provider not found"} />;

  return (
    <ChatProvider
      workspace={workspace}
      directory={directory}
      providerId={providerId}
      capacity={capacity}
      sessionId={sessionId}
      onSessionChange={onSessionChange}
      agent={agent}
      onAgentChange={onAgentChange}
      model={model}
      onModelChange={onModelChange}
    >
      <ChatSurface
        placeholder={chatplaceholder}
        readOnly={readOnly}
        topContent={topContent}
      />
    </ChatProvider>
  );
}

export interface ChatSurfaceProps {
  topContent?: ReactNode;
  placeholder?: string;
  allowTypingWhileSending?: boolean;
  className?: string;
  readOnly?: boolean;
}

export function ChatSurface({
  topContent,
  placeholder,
  allowTypingWhileSending,
  className,
  readOnly = false,
}: ChatSurfaceProps) {
  const [questionListSession, setQuestionListSession] = useState<string | null>(
    null,
  );
  const [selectedQuestion, setSelectedQuestion] = useState<{
    sessionId: string;
    id: string;
  } | null>(null);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [minimapOpen, setMinimapOpen] = useState(false);
  const [sessionView, setSessionView] = useState<{
    sessionId: string;
    directory?: string;
  } | null>(null);
  const sessionViewSeam = useMemo(
    () => ({
      openSessionView: (sessionId: string, directory?: string) =>
        setSessionView({ sessionId, directory }),
    }),
    [],
  );
  const {
    abortGeneration,
    isGenerating,
    directory,
    sessionId,
    sessionPickerOpen,
    setSessionPickerOpen,
    changeSession,
    capacity,
  } = useChat();
  const {
    sessionQuestions,
    currentQuestion: firstQuestion,
    sessionPermissions,
    currentPermission,
  } = useSessionData({
    sessionId,
    capabilities: {
      approvals: capacity.approvals,
      questions: capacity.questions,
    },
  });
  useEffect(() => {
    setQuestionListSession(null);
    setSelectedQuestion(null);
  }, [sessionId]);

  const questionListOpen =
    sessionId !== null && questionListSession === sessionId;
  const currentQuestion =
    selectedQuestion?.sessionId === sessionId
      ? sessionQuestions.find((question) => question.id === selectedQuestion.id)
      : undefined;
  const questionOpen = !!currentQuestion;

  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape") return;
    if (
      readOnly ||
      questionOpen ||
      questionListOpen ||
      permissionOpen ||
      !isGenerating
    )
      return;

    e.preventDefault();
    abortGeneration();
  };

  return (
    <SessionViewDialogContext.Provider value={sessionViewSeam}>
      <div
        className={cn(
          "relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background",
          className,
        )}
        tabIndex={-1}
        onKeyDown={handleContainerKeyDown}
      >
        {topContent}
        <div className="absolute z-50 top-0 left-0 right-0 flex justify-end gap-2 p-2">
          {!readOnly &&
            !!sessionQuestions.length &&
            !questionOpen &&
            !questionListOpen && (
              <QuestionBanner
                onOpenDialog={() => {
                  if (!sessionId || !firstQuestion) return;
                  if (sessionQuestions.length === 1) {
                    setSelectedQuestion({ sessionId, id: firstQuestion.id });
                  } else {
                    setQuestionListSession(sessionId);
                  }
                }}
                count={sessionQuestions.reduce(
                  (sum, q) => sum + (q.form ? 1 : q.questions.length),
                  0,
                )}
              />
            )}

          {!readOnly && !!sessionPermissions.length && !permissionOpen && (
            <PermissionBanner
              onOpenDialog={() => setPermissionOpen(true)}
              count={sessionPermissions.length}
            />
          )}
        </div>

        <MessageScrollerProvider autoScroll>
          <MessageList
            selectedSessionId={sessionId}
            directory={directory}
            minimapOpen={minimapOpen}
            onCloseMinimap={() => setMinimapOpen(false)}
          />
          {!readOnly && (
            <ChatInput
              placeholder={placeholder}
              allowTypingWhileSending={allowTypingWhileSending}
              supportsFileMentions={capacity.fileMentions}
              supportsCommands={capacity.commands}
            />
          )}
        </MessageScrollerProvider>

        {!readOnly && (
          <SessionStatusBar
            sessionId={sessionId}
            directory={directory}
            agentSelector={<AgentSelector variant="status" />}
            minimapOpen={minimapOpen}
            onToggleMinimap={() => setMinimapOpen((v) => !v)}
          />
        )}

        {!readOnly && (
          <Dialog
            open={questionListOpen}
            onOpenChange={(open) => {
              if (!open) setQuestionListSession(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pending questions</DialogTitle>
                <DialogDescription>
                  Choose a question to inspect and answer.
                </DialogDescription>
              </DialogHeader>
              <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
                {sessionQuestions.map((question) => (
                  <Button
                    key={question.id}
                    variant="outline"
                    className="h-auto justify-start whitespace-normal text-left"
                    onClick={() => {
                      if (!sessionId) return;
                      setQuestionListSession(null);
                      setSelectedQuestion({ sessionId, id: question.id });
                    }}
                  >
                    {question.form?.message ||
                      question.questions[0]?.question ||
                      question.id}
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {!readOnly && currentQuestion && (
          <QuestionSheet
            open={questionOpen}
            onOpenChange={(open) => {
              if (!open) setSelectedQuestion(null);
            }}
            question={currentQuestion}
          />
        )}

        {!readOnly && currentPermission && (
          <PermissionDialog
            open={permissionOpen}
            onOpenChange={setPermissionOpen}
            permission={currentPermission}
            sessionId={sessionId ?? ""}
          />
        )}

        {!readOnly && (
          <SessionPickerDialog
            open={sessionPickerOpen}
            onOpenChange={setSessionPickerOpen}
            directory={directory}
            sessionId={sessionId}
            onSessionChange={changeSession}
          />
        )}
      </div>

      <SessionViewDialog
        sessionId={sessionView?.sessionId ?? ""}
        directory={sessionView?.directory}
        open={sessionView !== null}
        onOpenChange={(open) => {
          if (!open) setSessionView(null);
        }}
      />
    </SessionViewDialogContext.Provider>
  );
}
