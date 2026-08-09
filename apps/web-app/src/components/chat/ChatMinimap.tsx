import { memo, useCallback, useMemo, useState } from "react";
import { Bot, ListTree, Search, User, X } from "lucide-react";
import type { Message } from "@/types/message";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useMessageScroller,
  useMessageScrollerVisibility,
} from "@/components/ui/message-scroller";
import { cn } from "@/lib/utils";

interface ChatMinimapProps {
  messages: Message[];
  onClose: () => void;
}

interface MinimapItem {
  id: string;
  role: "user" | "assistant";
  preview: string;
}

function extractPreview(message: Message): MinimapItem {
  const role = message.info.role as "user" | "assistant";
  const partTypes: string[] = [];
  let preview = "";

  for (const part of message.parts) {
    partTypes.push(part.type);

    if (part.type === "text") {
      const textPart = part as unknown as { text: string };
      if (textPart.text) {
        const truncated = textPart.text.slice(0, 50);
        if (!preview) preview = truncated;
      }
    }
  }

  if (!preview) {
    if (partTypes.includes("reasoning")) {
      preview = "[reasoning]";
    } else if (partTypes.includes("tool")) {
      preview = "[tool call]";
    } else if (partTypes.includes("file")) {
      preview = "[file]";
    } else if (partTypes.includes("subtask")) {
      preview = "[subtask]";
    } else if (partTypes.includes("agent")) {
      preview = "[agent]";
    } else if (partTypes.length > 0) {
      preview = `[${partTypes[0]}]`;
    } else {
      preview = "[empty]";
    }
  }

  if (preview.length > 50) {
    preview = preview.slice(0, 47) + "...";
  }

  return {
    id: message.info.id,
    role,
    preview,
  };
}

export const ChatMinimap = memo(function ChatMinimap({
  messages,
  onClose,
}: ChatMinimapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { scrollToMessage } = useMessageScroller();
  const { currentAnchorId, visibleMessageIds } = useMessageScrollerVisibility();

  const items = useMemo(() => messages.map(extractPreview), [messages]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) => item.preview.toLowerCase().includes(query));
  }, [items, searchQuery]);

  const visibleSet = useMemo(
    () => new Set(visibleMessageIds),
    [visibleMessageIds],
  );

  const handleClick = useCallback(
    (messageId: string) => {
      scrollToMessage(messageId, {
        align: "center",
        behavior: "smooth",
      });
    },
    [scrollToMessage],
  );

  return (
    <div className="absolute right-2 top-2 bottom-2 w-56 z-40 bg-background/95 backdrop-blur border rounded-lg shadow-xl flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <ListTree className="size-3.5" />
          <span>Chat Outline</span>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close chat outline"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="px-2 py-1.5 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-7 pr-7 py-1 text-xs bg-muted/50 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
        {filteredItems.length === 0 ? (
          <EmptyState
            size="inline"
            title={searchQuery ? "No matches found" : "No messages yet"}
          />
        ) : (
          filteredItems.map((item) => {
            const isActive =
              item.id === currentAnchorId || visibleSet.has(item.id);

            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={cn(
                  "w-full px-3 py-1.5 text-left text-xs flex items-start gap-2 transition-colors",
                  "hover:bg-muted/60",
                  isActive && "bg-muted/40 text-foreground",
                  !isActive && "text-muted-foreground",
                )}
              >
                <span className="flex-shrink-0 mt-0.5">
                  {item.role === "user" ? (
                    <User className="size-3 text-primary" />
                  ) : (
                    <Bot className="size-3" />
                  )}
                </span>
                <span className="truncate flex-1 leading-tight">
                  {item.preview}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
});
