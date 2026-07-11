import * as React from "react";
import { Home, MessageCircle, X } from "lucide-react";

import { useTabStore } from "@/stores/tabStore";
import { cn } from "@/lib/utils";

interface TabItemProps {
  icon: React.ReactNode;
  label?: string;
  isActive?: boolean;
  onClick?: () => void;
  onClose?: () => void;
}

function TabItem({ icon, label, isActive, onClick, onClose }: TabItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors duration-150",
        isActive
          ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className="[&>svg]:size-4">{icon}</span>
      {label && <span className="text-[13px] max-w-30 truncate">{label}</span>}
      {onClose && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="ml-1 rounded p-0.5 hover:bg-muted"
        >
          <X size={12} />
        </span>
      )}
    </button>
  );
}

export function MainTabBar() {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const removeTab = useTabStore((s) => s.removeTab);

  return (
    <div className="flex">
      <TabItem
        icon={<Home />}
        isActive={activeTabId === "home"}
        onClick={() => setActiveTab("home")}
      />
      <div className="flex flex-1 border-b overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            icon={<MessageCircle />}
            label={tab.data.sessionName}
            isActive={activeTabId === tab.id}
            onClick={() => setActiveTab(tab.id)}
            onClose={() => removeTab(tab.id)}
          />
        ))}
      </div>
    </div>
  );
}
