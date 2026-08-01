import { MessageCircle } from "lucide-react";
import { useSession } from "@/hooks/queries/useSessions";
import type { Tab } from "@/features/home/tabs/template";
import { TabItemShell } from "@/features/home/components/TabItemShell";

interface SessionTabItemProps {
  tab: Extract<Tab, { type: "session" }>;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

export function SessionTabItem({
  tab,
  isActive,
  onClick,
  onClose,
}: SessionTabItemProps) {
  const { data: session } = useSession({
    sessionId: tab.data.sessionId,
  });
  const displayName = session?.title ?? tab.data.sessionName ?? "New Chat";

  return (
    <TabItemShell
      icon={MessageCircle}
      label={displayName}
      workspaceId={tab.data.workspaceId}
      isActive={isActive}
      onClick={onClick}
      onClose={onClose}
    />
  );
}

export type { SessionData } from "./meta";
