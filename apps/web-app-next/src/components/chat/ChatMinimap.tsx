import { useEffect, useState, useCallback, useMemo } from "react";
import type { Message } from "@/types/message";
import { User, Bot, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMinimapProps {
  messages: Message[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  isVisible: boolean;
  onClose?: () => void;
}

interface MinimapItem {
  id: string;
  role: "user" | "assistant";
  preview: string;
  partTypes: string[];
  textContent: string;
}

function extractPreview(message: Message): MinimapItem {
  const role = message.info.role as "user" | "assistant";
  const partTypes: string[] = [];
  let preview = "";
  let textContent = "";

  for (const part of message.parts) {
    partTypes.push(part.type);

    if (part.type === "text") {
      const textPart = part as unknown as { text: string };
      if (textPart.text) {
        const truncated = textPart.text.slice(0, 50);
        if (!preview) preview = truncated;
        textContent += textPart.text.toLowerCase();
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
    partTypes,
    textContent,
  };
}

export function ChatMinimap({
  messages,
  scrollRef,
  isVisible,
  onClose,
}: ChatMinimapProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const items: MinimapItem[] = messages
    .map(extractPreview)
    .filter((item) => item.textContent.length > 0);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.preview.toLowerCase().includes(query) ||
        item.textContent.includes(query),
    );
  }, [items, searchQuery]);

  const scrollToMessage = useCallback(
    (messageId: string) => {
      if (!scrollRef.current) return;

      const scrollContainer = scrollRef.current;
      const messageElement = scrollContainer.querySelector(
        `[data-message-id="${messageId}"]`,
      );

      if (messageElement) {
        messageElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    },
    [scrollRef],
  );

  useEffect(() => {
    if (!scrollRef.current) return;

    const scrollContainer = scrollRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute("data-message-id");
            if (messageId) {
              setActiveId(messageId);
            }
          }
        }
      },
      {
        root: scrollContainer,
        threshold: 0.5,
      },
    );

    const messageElements =
      scrollContainer.querySelectorAll("[data-message-id]");
    for (const el of messageElements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [messages, scrollRef]);

  if (!isVisible) return null;

  return (
    <div className="fixed right-2 top-20 w-56 h-[calc(100vh-10rem)] bg-background/95 backdrop-blur border rounded-lg shadow-xl flex flex-col z-50">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-medium text-muted-foreground">
          Chat Outline
        </span>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          disabled={!onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <div className="px-2 py-1.5 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-7 pr-2 py-1 text-xs bg-muted/50 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {filteredItems.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            {searchQuery ? "No matches found" : "No messages yet"}
          </div>
        ) : (
          filteredItems.map((item) => {
            const isActive = activeId === item.id;
            const isSearchMatch =
              searchQuery &&
              item.textContent.includes(searchQuery.toLowerCase());

            return (
              <button
                key={item.id}
                onClick={() => scrollToMessage(item.id)}
                className={cn(
                  "w-full px-3 py-1.5 text-left text-xs flex items-start gap-2 transition-all",
                  "hover:bg-muted/50",
                  isActive && !isSearchMatch && "bg-muted/30",
                  isSearchMatch && "bg-primary/10",
                )}
              >
                <span className="flex-shrink-0 mt-0.5">
                  {item.role === "user" ? (
                    <User className="w-3 h-3 text-primary" />
                  ) : (
                    <Bot className="w-3 h-3 text-muted-foreground" />
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
}
