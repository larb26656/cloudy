import type { ReactNode } from "react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilesResponsiveHeaderProps {
  hasSelection: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  openTitle: string;
  closeTitle: string;
  children?: ReactNode;
}

export function FilesResponsiveHeader({
  hasSelection,
  isSidebarOpen,
  onToggleSidebar,
  openTitle,
  closeTitle,
  children,
}: FilesResponsiveHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b px-4 py-2.5",
        !hasSelection && "@files:hidden",
      )}
    >
      <Button
        variant="ghost"
        size="icon-sm"
        className="@files:hidden"
        onClick={onToggleSidebar}
        title={isSidebarOpen ? closeTitle : openTitle}
      >
        {isSidebarOpen ? (
          <PanelLeftClose className="size-4" />
        ) : (
          <PanelLeft className="size-4" />
        )}
      </Button>
      {children}
    </div>
  );
}
