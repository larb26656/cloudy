import { MessageCircle } from "lucide-react";
import { useSession } from "@/hooks/queries/useSessions";
import type { Tab } from "@/features/home/tabs/template";
import { TabItemShell } from "@/features/home/components/TabItemShell";

interface ChatTabItemProps {
  tab: Extract<Tab, { type: "chat" }>;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

export function ChatTabItem({
  tab,
  isActive,
  onClick,
  onClose,
}: ChatTabItemProps) {
  const { data: session } = useSession({
    sessionId: tab.data.sessionId,
  });
  const displayName = session?.title ?? tab.data.sessionName ?? "New Chat";

  return (
    <TabItemShell
      icon={MessageCircle}
      label={displayName}
      isActive={isActive}
      onClick={onClick}
      onClose={onClose}
    />
  );
}

export type { ChatData } from "./meta";
