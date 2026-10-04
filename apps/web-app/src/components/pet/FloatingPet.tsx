import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import { useQueries } from "@tanstack/react-query";
import type {
  PermissionRequest as CorePermissionRequest,
  ProviderQuestionRequest,
} from "@repo/contracts";
import {
  Cat,
  EyeOff,
  Loader2,
  MessageCircleQuestion,
  ShieldAlert,
  X,
} from "lucide-react";
import { useRecentSessions } from "@/hooks/queries/useSessions";
import { useWorkspaces } from "@/hooks/queries";
import {
  CHAT_POLL_INTERVAL,
  permissionKeys,
  questionKeys,
} from "@/lib/opencode";
import { sessionApi } from "@/lib/cloudy/provider";
import { useTabStore } from "@/stores/tabStore";
import type {
  PermissionRequest,
  QuestionRequest,
  RecentChatSession,
} from "@/types";
import type { Workspace } from "@/lib/cloudy/workspaces";
import { cn } from "@repo/ui/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { LoadingState } from "@repo/ui/components/loading-state";

type PetState = "idle" | "working" | "wait-for-human";
type PetPosition = { left: number; top: number };

const petSprite = "/sprite/cloudy-pet/sprite-sheet.png";
const petFrameCount = 8;
const petStateRow: Record<PetState, number> = {
  idle: 0,
  working: 1,
  "wait-for-human": 2,
};
const petFrameDuration: Record<PetState, number> = {
  idle: 260,
  working: 140,
  "wait-for-human": 220,
};

interface ActiveSessionRecord {
  session: RecentChatSession;
  state: Exclude<PetState, "idle">;
  reason?: "question" | "permission";
}

function PetSprite({ state }: { state: PetState }) {
  const [frame, setFrame] = useState(0);
  const row = petStateRow[state];

  useEffect(() => {
    setFrame(0);

    const interval = window.setInterval(
      () => setFrame((current) => (current + 1) % petFrameCount),
      petFrameDuration[state],
    );

    return () => window.clearInterval(interval);
  }, [state]);

  return (
    <span
      aria-hidden="true"
      data-pet-sprite
      data-frame={frame}
      data-pet-row={row}
      className="block size-full bg-no-repeat"
      style={{
        backgroundImage: `url(${petSprite})`,
        backgroundPosition: `${frame * (100 / (petFrameCount - 1))}% ${row * 50}%`,
        backgroundSize: "800% 300%",
      }}
    />
  );
}

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

function toQuestion(request: ProviderQuestionRequest): QuestionRequest {
  return {
    id: request.id,
    sessionID: request.sessionId,
    questions: request.questions.map((question) => ({
      ...question,
      multiple: question.multiple ?? false,
    })),
  };
}

function toPermission(request: CorePermissionRequest): PermissionRequest {
  return {
    id: request.id,
    sessionID: request.sessionId,
    permission: request.permission,
    patterns: request.patterns,
    always: request.always,
    tool: request.tool ? { messageID: request.tool.messageId } : undefined,
  };
}

async function fetchSessionQuestions(
  sessionId: string,
): Promise<QuestionRequest[]> {
  return (
    await json<ProviderQuestionRequest[]>(await sessionApi.questions(sessionId))
  ).map(toQuestion);
}

async function fetchSessionPermissions(
  sessionId: string,
): Promise<PermissionRequest[]> {
  return (
    await json<CorePermissionRequest[]>(await sessionApi.permissions(sessionId))
  ).map(toPermission);
}

export function FloatingPet() {
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PetPosition | null>(null);
  const drag = useRef<
    | {
        pointerId: number;
        offsetX: number;
        offsetY: number;
      }
    | undefined
  >(undefined);
  const didDrag = useRef(false);
  const { data: sessions, isLoading, error } = useRecentSessions({ limit: 8 });
  const { data: workspaces = [] } = useWorkspaces();
  const openTab = useTabStore((s) => s.openTab);

  const candidates = useMemo(
    () =>
      (sessions ?? []).filter(
        (session) =>
          session.runStatus === "running" || session.status === "active",
      ),
    [sessions],
  );

  const questionResults = useQueries({
    queries: candidates.map((session) => ({
      queryKey: questionKeys.list(session.id),
      queryFn: () => fetchSessionQuestions(session.id),
      refetchInterval: CHAT_POLL_INTERVAL,
      refetchIntervalInBackground: false,
    })),
  });

  const permissionResults = useQueries({
    queries: candidates.map((session) => ({
      queryKey: permissionKeys.list(session.id),
      queryFn: () => fetchSessionPermissions(session.id),
      refetchInterval: CHAT_POLL_INTERVAL,
      refetchIntervalInBackground: false,
    })),
  });

  const records: ActiveSessionRecord[] = [];
  {
    for (const [index, session] of candidates.entries()) {
      const questions = questionResults[index]?.data ?? [];
      const permissions = permissionResults[index]?.data ?? [];
      if (questions.length > 0) {
        records.push({ session, state: "wait-for-human", reason: "question" });
        continue;
      }
      if (permissions.length > 0) {
        records.push({
          session,
          state: "wait-for-human",
          reason: "permission",
        });
        continue;
      }
      if (session.runStatus === "running") {
        records.push({ session, state: "working" });
      }
    }
    records.sort((a, b) => {
      if (a.state !== b.state) return a.state === "wait-for-human" ? -1 : 1;
      return b.session.updatedAt - a.session.updatedAt;
    });
  }

  const waitingCount = records.filter(
    (record) => record.state === "wait-for-human",
  ).length;
  const workingCount = records.length - waitingCount;

  const petState: PetState =
    waitingCount > 0 ? "wait-for-human" : workingCount > 0 ? "working" : "idle";

  const handleOpenSession = (session: RecentChatSession) => {
    const dir = session.directory;
    const workspace: Workspace | undefined = workspaces.find(
      (w) => w.directory === dir,
    );
    if (workspace?.type === "bot") {
      openTab("bot-chat", {
        sessionId: session.id,
        workspaceId: workspace.id,
        directory: dir,
        sessionName: session.title || "New Bot Chat",
      });
    } else {
      openTab("chat", {
        providerId: session.providerId,
        sessionId: session.id,
        workspaceId: workspace?.id ?? null,
        directory: dir,
        sessionName: session.title || "New Chat",
      });
    }
    setOpen(false);
  };

  const handleDismiss = () => {
    setOpen(false);
    setDismissed(true);
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    drag.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    };
    didDrag.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const currentDrag = drag.current;
    if (currentDrag?.pointerId !== event.pointerId) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const left = Math.min(
      Math.max(12, event.clientX - currentDrag.offsetX),
      Math.max(12, window.innerWidth - bounds.width - 12),
    );
    const top = Math.min(
      Math.max(12, event.clientY - currentDrag.offsetY),
      Math.max(12, window.innerHeight - bounds.height - 12),
    );

    if (Math.abs(left - bounds.left) > 2 || Math.abs(top - bounds.top) > 2) {
      didDrag.current = true;
      setPosition({ left, top });
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.pointerId === event.pointerId) {
      drag.current = undefined;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  };

  if (dismissed) {
    return (
      <button
        type="button"
        aria-label="Show pet"
        onClick={() => setDismissed(false)}
        className="fixed right-4 bottom-4 z-30 flex size-9 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Cat data-icon className="size-4" />
      </button>
    );
  }

  let content: ReactNode;
  if (isLoading) {
    content = <LoadingState size="compact" title={null} />;
  } else if (error) {
    content = (
      <ErrorState size="compact" bare message="Failed to load sessions" />
    );
  } else if (records.length === 0) {
    content = (
      <EmptyState
        size="compact"
        title="No session needs attention"
        description="Working and waiting sessions will appear here"
      />
    );
  } else {
    content = (
      <ul className="flex flex-col">
        {records.map((record) => {
          const isWaiting = record.state === "wait-for-human";
          const Icon = isWaiting
            ? record.reason === "permission"
              ? ShieldAlert
              : MessageCircleQuestion
            : Loader2;
          const workspaceName = workspaces.find(
            (w) => w.directory === record.session.directory,
          )?.name;
          return (
            <li key={record.session.id}>
              <button
                type="button"
                onClick={() => handleOpenSession(record.session)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon
                  data-icon
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground",
                    !isWaiting && "animate-spin",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {record.session.title || "Untitled"}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {workspaceName ?? record.session.directory}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 text-xs",
                    isWaiting
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {isWaiting ? "Waiting for you" : "Working"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  const triggerLabel =
    waitingCount > 0
      ? `Agent activity: ${waitingCount} session${waitingCount === 1 ? "" : "s"} waiting for you`
      : workingCount > 0
        ? `Agent activity: ${workingCount} session${workingCount === 1 ? "" : "s"} working`
        : "Agent activity";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={triggerLabel}
            data-pet-state={petState}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={(event) => {
              if (didDrag.current) {
                event.preventDefault();
                didDrag.current = false;
              }
            }}
            className="fixed right-3 bottom-3 z-30 flex size-16 touch-none cursor-grab items-center justify-center rounded-xl bg-transparent select-none active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:right-4 sm:bottom-4 sm:size-24"
            style={position ?? undefined}
          />
        }
      >
        <span className="relative block size-full">
          <PetSprite state={petState} />
        </span>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        className="w-80 gap-0 p-0"
      >
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
          <PopoverTitle className="text-sm font-semibold">
            Agent activity
          </PopoverTitle>
          <div className="flex items-center">
            <button
              type="button"
              aria-label="Hide pet"
              onClick={handleDismiss}
              className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <EyeOff data-icon className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Close agent activity"
              onClick={() => setOpen(false)}
              className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X data-icon className="size-3.5" />
            </button>
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">{content}</div>
      </PopoverContent>
    </Popover>
  );
}
