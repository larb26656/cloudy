// components/layout/Sidebar.tsx
import { SessionList } from '@/components/session/SessionList';

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
  onClose: () => void;
}

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[300px] sm:w-[320px] p-0">
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
