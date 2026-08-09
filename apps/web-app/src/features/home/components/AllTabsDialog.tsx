import type { ReactNode } from "react";
import { useTabStore } from "@/stores/tabStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TabCard } from "./TabCard";

interface AllTabsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AllTabsDialog({ open, onOpenChange }: AllTabsDialogProps) {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const removeTab = useTabStore((s) => s.removeTab);

  const handleSwitch = (id: string) => {
    setActiveTab(id);
    onOpenChange(false);
  };

  let content: ReactNode;
  if (tabs.length === 0) {
    content = (
      <EmptyState
        size="full"
        title="No open tabs"
        description="Tabs you open will show up here."
      />
    );
  } else {
    content = (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {tabs.map((tab) => (
          <TabCard
            key={tab.id}
            tab={tab}
            isActive={activeTabId === tab.id}
            onSwitch={() => handleSwitch(tab.id)}
            onClose={() => removeTab(tab.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-w-none flex-col gap-0 rounded-none p-0 inset-0 top-0 left-0 translate-x-0 translate-y-0 sm:max-w-none h-full w-full"
      >
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
          <DialogHeader className="gap-0">
            <DialogTitle>
              All tabs{tabs.length > 0 ? ` (${tabs.length})` : ""}
            </DialogTitle>
          </DialogHeader>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{content}</div>
      </DialogContent>
    </Dialog>
  );
}
