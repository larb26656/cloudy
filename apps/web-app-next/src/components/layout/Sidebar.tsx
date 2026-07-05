import { useState } from "react";
import { SessionList } from "@/components/session/SessionList";
import { WorkspaceStrip } from "../workspace/WorkspaceStrip";
import { SidebarHeader } from "./SidebarHeader";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Session } from "@opencode-ai/sdk/v2";

const now = Date.now();

const MOCK_SESSIONS: Session[] = [
  {
    id: "session-mock-0001",
    title: "Welcome to cloudy (mock)",
    parentID: null,
    share: { id: "session-mock-0001" },
    time: { created: now - 1000 * 60 * 5, updated: now - 1000 * 60 * 5 },
    version: "v2",
  } as unknown as Session,
  {
    id: "session-mock-0002",
    title: "Project scaffolding ideas (mock)",
    parentID: null,
    share: { id: "session-mock-0002" },
    time: { created: now - 1000 * 60 * 60 * 2, updated: now - 1000 * 60 * 60 * 2 },
    version: "v2",
  } as unknown as Session,
];

interface SidebarProps {
  instanceId: string;
  className?: string;
}

export function Sidebar({ instanceId, className }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div
      className={cn([
        "flex h-full lg:border lg:rounded-2xl",
        className,
      ])}
    >
      <WorkspaceStrip instanceId={instanceId} />
      <div className="flex flex-col flex-1 min-w-0">
        <SidebarHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <SessionList searchQuery={searchQuery} sessions={MOCK_SESSIONS} />
      </div>
    </div>
  );
}

interface MobileSidebarProps {
  instanceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({
  instanceId,
  open,
  onOpenChange,
}: MobileSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="left"
        className="w-[300px] sm:w-[320px] p-0"
        showCloseButton={false}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Sessions</SheetTitle>
        </SheetHeader>
        <div className="h-full flex">
          <WorkspaceStrip instanceId={instanceId} />
          <div className="flex flex-col flex-1 min-w-0">
            <SidebarHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            <SessionList searchQuery={searchQuery} sessions={MOCK_SESSIONS} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
