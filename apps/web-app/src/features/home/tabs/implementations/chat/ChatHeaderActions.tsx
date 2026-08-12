import { PanelRight } from "lucide-react";
import { AppBar } from "@/components/layout";
import { cn } from "@/lib/utils";
import { useChatPanelStore } from "@/stores/chatPanelStore";
import type { TabHeaderActionsProps } from "../../template";

export function ChatHeaderActions({ tab }: TabHeaderActionsProps) {
  const filesOpen = useChatPanelStore(
    (s) => s.filesOpenByTabId[tab.id] ?? false,
  );
  const toggleFiles = useChatPanelStore((s) => s.toggleFiles);

  return (
    <AppBar.ActionIcon
      icon={PanelRight}
      label="Toggle files panel"
      onClick={() => toggleFiles(tab.id)}
      data-active={filesOpen ? "true" : undefined}
      className={cn(filesOpen && "bg-muted text-foreground")}
    />
  );
}
