import { useState } from "react";
import { SessionList } from "./SessionList";
import { WorkspaceStrip } from "@/components/workspace/WorkspaceStrip";
import { SidebarHeader } from "./SidebarHeader";
import { cn } from "@/lib/utils";

interface SidebarProps {
  instanceId: string;
  className?: string;
}

export function Sidebar({ instanceId, className }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className={cn(["flex h-full lg:border lg:rounded-2xl", className])}>
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
