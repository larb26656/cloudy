import * as React from "react";
import { useState } from "react";
import { Globe, Home, MessageCircle, PenTool, Plus, X } from "lucide-react";

import { useTabStore, type SessionData, type WebviewData } from "@/stores/tabStore";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/queries/useSessions";
import { CreateChatDialog } from "@/features/chat/components/CreateChatDialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MenuEntry =
  | { type: "item"; id: string; label: string; icon?: React.ReactNode; action: () => void; disabled?: boolean }
  | { type: "separator"; id: string };

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

function SessionTabItem({
  tab,
  isActive,
  onClick,
  onClose,
}: {
  tab: { id: string; type: "session"; data: SessionData };
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}) {
  const { data: session } = useSession({ sessionId: tab.data.sessionId });
  const displayName = session?.title ?? tab.data.sessionName ?? "New Chat";

  return (
    <TabItem
      icon={<MessageCircle />}
      label={displayName}
      isActive={isActive}
      onClick={onClick}
      onClose={onClose}
    />
  );
}

function DeskTabItem({
  isActive,
  onClick,
  onClose,
}: {
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}) {
  return (
    <TabItem
      icon={<PenTool />}
      label="Desk"
      isActive={isActive}
      onClick={onClick}
      onClose={onClose}
    />
  );
}

function WebviewTabItem({
  tab,
  isActive,
  onClick,
  onClose,
}: {
  tab: { id: string; type: "webview"; data: WebviewData };
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}) {
  const hostname = (() => {
    try {
      return new URL(tab.data.url).hostname;
    } catch {
      return tab.data.url;
    }
  })();

  return (
    <TabItem
      icon={<Globe />}
      label={hostname}
      isActive={isActive}
      onClick={onClick}
      onClose={onClose}
    />
  );
}

export function MainTabBar() {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const removeTab = useTabStore((s) => s.removeTab);
  const addTab = useTabStore((s) => s.addTab);
  const [createChatOpen, setCreateChatOpen] = useState(false);
  const [webviewDialogOpen, setWebviewDialogOpen] = useState(false);
  const [webviewUrl, setWebviewUrl] = useState("");

  const handleOpenWebview = () => {
    let normalizedUrl = webviewUrl.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }
    addTab("webview", { url: normalizedUrl, history: [normalizedUrl], historyIndex: 0 });
    setWebviewUrl("");
    setWebviewDialogOpen(false);
  };

  const menuItems: MenuEntry[] = [
    { type: "item", id: "new-chat", label: "New Chat", icon: <MessageCircle />, action: () => setCreateChatOpen(true) },
    { type: "item", id: "new-canvas", label: "New Canvas", icon: <PenTool />, action: () => addTab("desk", {}) },
    { type: "item", id: "new-webview", label: "New Webview", icon: <Globe />, action: () => setWebviewDialogOpen(true) },
  ];

  const handleMenuItemClick = (entry: MenuEntry) => {
    if (entry.type === "item" && !entry.disabled) {
      entry.action();
    }
  };

  return (
    <>
      <div className="flex border-b">
        <TabItem
          icon={<Home />}
          isActive={activeTabId === "home"}
          onClick={() => setActiveTab("home")}
        />
        <div className="flex flex-1 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            if (tab.type === "session") {
              return (
                <SessionTabItem
                  key={tab.id}
                  tab={tab}
                  isActive={activeTabId === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  onClose={() => removeTab(tab.id)}
                />
              );
            }
            if (tab.type === "desk") {
              return (
                <DeskTabItem
                  key={tab.id}
                  isActive={activeTabId === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  onClose={() => removeTab(tab.id)}
                />
              );
            }
            return (
              <WebviewTabItem
                key={tab.id}
                tab={tab}
                isActive={activeTabId === tab.id}
                onClick={() => setActiveTab(tab.id)}
                onClose={() => removeTab(tab.id)}
              />
            );
          })}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <Plus size={16} />
              </button>
            }
          />
          <DropdownMenuContent align="end">
            {menuItems.map((entry) =>
              entry.type === "separator" ? (
                <DropdownMenuSeparator key={entry.id} />
              ) : (
                <DropdownMenuItem
                  key={entry.id}
                  disabled={entry.disabled}
                  onClick={() => handleMenuItemClick(entry)}
                >
                  {entry.icon && (
                    <span className="mr-2 [&>svg]:size-4">{entry.icon}</span>
                  )}
                  {entry.label}
                </DropdownMenuItem>
              )
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CreateChatDialog
        open={createChatOpen}
        onOpenChange={setCreateChatOpen}
      />

      <Dialog open={webviewDialogOpen} onOpenChange={setWebviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Open Webpage</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={webviewUrl}
              onChange={(e) => setWebviewUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOpenWebview()}
              placeholder="Enter URL (e.g., example.com)"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setWebviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleOpenWebview} disabled={!webviewUrl.trim()}>
              Open
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
