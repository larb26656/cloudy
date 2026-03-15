// components/layout/Sidebar.tsx
import { SessionList } from "@/components/session/SessionList";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={`h-full bg-muted border-r ${className}`}>
      <SessionList />
    </div>
  );
}

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[300px] sm:w-[320px] p-0"
        onInteractOutside={() => {
          onOpenChange(false);
        }}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Sessions</SheetTitle>
        </SheetHeader>
        <div className="h-full">
          <SessionList />
        </div>
      </SheetContent>
    </Sheet>
  );
}
