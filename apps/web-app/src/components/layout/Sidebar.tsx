import { useState } from "react";
import { SessionList } from "@/components/session/SessionList";
import { SidebarHeader } from "./SidebarHeader";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@cloudy/ui";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div
      className={cn([
        "flex flex-col h-full lg:border lg:rounded-2xl",
        className,
      ])}
    >
      <SidebarHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <SessionList searchQuery={searchQuery} />
    </div>
  );
}

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[300px] sm:w-[320px] p-0"
        onInteractOutside={() => {
          onOpenChange(false);
        }}
        showCloseButton={false}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Sessions</SheetTitle>
        </SheetHeader>
        <div className="h-full flex flex-col">
          <SidebarHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <SessionList searchQuery={searchQuery} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
