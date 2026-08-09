import { X } from "lucide-react";
import type { Tab } from "@/stores/tabStore";
import { WorkspaceDot } from "@/components/workspace/WorkspaceDot";
import { cn } from "@/lib/utils";
import { getTabWorkspaceId, TabTitle, tabTypeMap } from "../tabs/template";

interface TabCardProps {
  tab: Tab;
  isActive: boolean;
  onSwitch: () => void;
  onClose: () => void;
}

export function TabCard({ tab, isActive, onSwitch, onClose }: TabCardProps) {
  const template = tabTypeMap[tab.type];
  if (!template) return null;
  const Icon = template.icon;

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
        <WorkspaceDot workspaceId={getTabWorkspaceId(tab) ?? undefined} />
        <span className="truncate text-sm font-medium">
          <TabTitle tab={tab} />
        </span>
      </div>
      <span className="text-xs text-muted-foreground">{template.label}</span>
    </button>
  );
}
