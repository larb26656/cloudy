import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";

import { useTabStore } from "@/stores/tabStore";
import { useSessionStore } from "@/stores/sessionStore";
import { cn } from "@/lib/utils";

export function SessionTabBar() {
  const navigate = useNavigate();
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const removeTab = useTabStore((s) => s.removeTab);
  const selectSession = useSessionStore((s) => s.selectSession);

  if (tabs.length === 0) return null;

  return (
    <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b pb-2">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            role="tab"
            tabIndex={0}
            aria-selected={isActive}
            onClick={() => {
              setActiveTab(tab.id);
              selectSession(tab.data.sessionId);
              void navigate({ to: "/" });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveTab(tab.id);
                selectSession(tab.data.sessionId);
                void navigate({ to: "/" });
              }
            }}
            className={cn(
              "group flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors",
              isActive
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <span className="max-w-32 truncate">
              {tab.data.sessionName || "New Chat"}
            </span>
            <button
              type="button"
              aria-label="Close tab"
              onClick={(e) => {
                e.stopPropagation();
                removeTab(tab.id);
              }}
              className="flex size-4 items-center justify-center rounded-sm opacity-50 hover:bg-muted hover:opacity-100"
            >
              <X className="size-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
