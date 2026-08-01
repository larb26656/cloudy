import { Globe } from "lucide-react";
import type { Tab } from "@/stores/tabStore";
import { TabItemShell } from "@/features/home/components/TabItemShell";

interface WebviewTabItemProps {
  tab: Extract<Tab, { type: "webview" }>;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

export function WebviewTabItem({
  tab,
  isActive,
  onClick,
  onClose,
}: WebviewTabItemProps) {
  const hostname = (() => {
    try {
      return new URL(tab.data.url).hostname;
    } catch {
      return tab.data.url;
    }
  })();

  return (
    <TabItemShell
      icon={Globe}
      label={hostname}
      isActive={isActive}
      onClick={onClick}
      onClose={onClose}
    />
  );
}
