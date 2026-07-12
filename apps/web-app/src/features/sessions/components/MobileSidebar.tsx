import { useState } from "react";
import { SessionList } from "./SessionList";
import { WorkspaceStrip } from "@/components/workspace/WorkspaceStrip";
import { SidebarHeader } from "./SidebarHeader";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
            <SessionList searchQuery={searchQuery} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
