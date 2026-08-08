import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useTabStore, type Tab } from "@/stores/tabStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkspaceDot } from "@/components/workspace/WorkspaceDot";
import { cn } from "@/lib/utils";
import { tabTypeMap } from "../tabs/template";

interface AllTabsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Derive a display title + workspace association for a tab card. */
function getTabCardMeta(tab: Tab): {
  title: string;
  workspaceId?: string | null;
} {
  switch (tab.type) {
    case "chat":
      return {
        title: tab.data.sessionName || "New Chat",
        workspaceId: tab.data.workspaceId,
      };
    case "desk":
      return { title: tab.data.name };
    case "webview":
      return { title: tab.data.url || "New Webview" };
    case "files":
      return { title: "Changed Files", workspaceId: tab.data.workspaceId };
    case "terminal":
      return { title: "New Terminal", workspaceId: tab.data.workspaceId };
  }
}

function TabCard({
  tab,
  isActive,
  onSwitch,
  onClose,
}: {
  tab: Tab;
  isActive: boolean;
  onSwitch: () => void;
  onClose: () => void;
}) {
  const template = tabTypeMap[tab.type];
  if (!template) return null;
  const Icon = template.icon;
  const { title, workspaceId } = getTabCardMeta(tab);

  return (
    <button
      onClick={onSwitch}
      className={cn(
        "relative flex w-full flex-col items-start gap-2.5 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent",
        isActive && "border-primary ring-1 ring-primary",
      )}
    >
      <span
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-2 top-2 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X size={14} />
      </span>
      <span className="flex size-9 items-center justify-center rounded-lg bg-muted [&>svg]:size-5">
        <Icon />
      </span>
      <div className="flex w-full items-center gap-1.5 pr-5">
        <WorkspaceDot workspaceId={workspaceId ?? undefined} />
        <span className="truncate text-sm font-medium">{title}</span>
      </div>
      <span className="text-xs text-muted-foreground">{template.label}</span>
    </button>
  );
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
