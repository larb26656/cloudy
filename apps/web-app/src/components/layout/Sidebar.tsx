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
        <SessionList searchQuery={searchQuery} />
      </div>
    </div>
  );
}

interface MobileSidebarProps {
  instanceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ instanceId, open, onOpenChange }: MobileSidebarProps) {
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
            <SessionList searchQuery={searchQuery} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
