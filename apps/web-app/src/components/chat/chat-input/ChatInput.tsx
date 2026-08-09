import { ArrowUp, Square } from "lucide-react";
import { ModelSelector } from "../ModelSelector";
import { AgentSelector } from "../AgentSelector";
import { Button } from "@/components/ui/button";
import { type ChatInputContent } from "@/lib/opencode";
import { cn } from "@/lib/utils";
import { getNextName } from "@/lib/cycleName";
import { useAgents } from "@/hooks/queries/useAgents";
import { ChatInputEditor } from "./ChatInputEditor";
import SpeechBtn from "./SpeechBtn";
import { useChat } from "../ChatProvider";
import { useMessageScroller } from "@/components/ui/message-scroller";
import { memo, useEffect, useRef, useState } from "react";

interface ChatInputProps {
  placeholder?: string;
  initialValue?: string;
}

const MOCK_HISTORY: string[] = [];

export const ChatInput = memo(function ChatInput({
  placeholder = "Type a message...",
  initialValue,
}: ChatInputProps) {
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [chatInputContent, setChatInputContent] = useState<ChatInputContent>({
    text: "",
    mentions: [],
  });

  const {
    effectiveModel,
    effectiveAgent,
    directory,
    sendMessage,
    abortGeneration,
    executeImmediateCommand,
    setAgent,
    isSending,
    isStreaming,
  } = useChat();

  const { data: agents } = useAgents();

  const { scrollToEnd } = useMessageScroller();

  const [isListening, setIsListening] = useState(false);
  const [speechDraft, setSpeechDraft] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

  const speechBaseRef = useRef("");
  const prevListeningRef = useRef(false);

  const currentHistorySelectValue =
    historyIndex === -1 ? "" : (MOCK_HISTORY[historyIndex] ?? "");

  useEffect(() => {
    if (initialValue) {
      setChatInputContent({ text: initialValue, mentions: [] });
      setSpeechDraft("");
      speechBaseRef.current = initialValue;
    }
  }, [initialValue]);

  useEffect(() => {
    setChatInputContent({ text: currentHistorySelectValue, mentions: [] });
  }, [historyIndex, currentHistorySelectValue]);

  useEffect(() => {
    if (isListening && !prevListeningRef.current) {
      speechBaseRef.current = chatInputContent.text;
    }

    if (!isListening && prevListeningRef.current) {
      const merged = `${speechBaseRef.current} ${speechDraft}`.trim();
      speechBaseRef.current = merged;

      setChatInputContent((prev) => ({ ...prev, text: merged }));
      setSpeechDraft("");
    }

    prevListeningRef.current = isListening;
  }, [isListening, speechDraft, chatInputContent.text]);

  const displayText = isListening
    ? `${speechBaseRef.current} ${speechDraft}`.trim()
    : chatInputContent.text;

  const handleImmediateExecute = (commandName: string) => {
    void executeImmediateCommand(commandName);
    setChatInputContent({ text: "", mentions: [] });
  };

  const handleSubmit = () => {
    const finalText = displayText.trim();
    if (finalText && !isSending) {
      scrollToEnd();
      void sendMessage(
        { ...chatInputContent, text: finalText },
        effectiveModel,
        effectiveAgent,
      );
      setChatInputContent({ text: "", mentions: [] });
      setSpeechDraft("");
      setHistoryIndex(-1);
    }
  };

  const handleHistoryCursor = (e: React.KeyboardEvent) => {
    if (!MOCK_HISTORY.length) return;
    if (chatInputContent.text !== currentHistorySelectValue) return;

    if (e.key === "ArrowUp") {
      setHistoryIndex((i) =>
        i === -1 ? MOCK_HISTORY.length - 1 : Math.max(0, i - 1),
      );
    } else if (e.key === "ArrowDown") {
      setHistoryIndex((i) =>
        i === -1 || i === MOCK_HISTORY.length - 1 ? -1 : i + 1,
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "m") {
      e.preventDefault();
      setModelOpen(true);
      return;
    }

    if (e.key === "Escape") {
      if (isStreaming && !displayText.trim()) {
        e.preventDefault();
        abortGeneration();
      }
      return;
    }

    if (e.key === "Tab") {
      const names = agents?.map((a) => a.name) ?? [];
      if (names.length > 0) {
        e.preventDefault();
        const next = getNextName(
          names,
          effectiveAgent,
          e.shiftKey ? "prev" : "next",
        );
        if (next) setAgent(next);
      }
      return;
    }

    if (e.key === "@" || e.key === "/") {
      if (directory) return;
    }
    handleHistoryCursor(e);

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 @container">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-2">
          <div
            className={cn(
              "flex flex-col gap-2 bg-muted border rounded-2xl px-4 py-2 w-full",
              !isFocused && "@max-compact:flex-row @max-compact:items-center",
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setIsFocused(false);
              }
            }}
          >
            <div
              className={cn(
                "flex gap-2 w-full pt-2",
                !isFocused && "@max-compact:flex-1 @max-compact:pt-0",
              )}
            >
              <ChatInputEditor
                content={{ ...chatInputContent, text: displayText }}
                onChange={(next) => {
                  if (!isListening) {
                    setChatInputContent(next);
                    speechBaseRef.current = next.text;
                  }
                }}
                onKeyDown={handleKeyDown}
                onImmediateExecute={handleImmediateExecute}
                placeholder={placeholder}
                disabled={isSending}
                directory={directory}
              />
            </div>

            <div
              className={cn(
                "flex gap-2 justify-between",
                !isFocused && "@max-compact:shrink-0",
              )}
            >
              <div
                className={cn(
                  "flex gap-2 min-w-0 overflow-x-auto items-center",
                  !isFocused && "@max-compact:hidden",
                )}
              >
                <AgentSelector />
                <ModelSelector open={modelOpen} onOpenChange={setModelOpen} />
              </div>

              <div className="flex gap-2 shrink-0">
                <SpeechBtn
                  onTranscript={(text) => setSpeechDraft(text)}
                  onListeningChange={setIsListening}
                />

                {isListening ? null : isStreaming && !displayText.trim() ? (
                  <Button
                    size="icon"
                    className="rounded-full p-4"
                    onClick={abortGeneration}
                    title="Stop generating"
                  >
                    <Square className="size-5" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    className="rounded-full p-4"
                    onClick={handleSubmit}
                    disabled={!displayText.trim()}
                    title="Send message"
                  >
                    <ArrowUp className="size-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="text-center mt-2 text-xs text-muted-foreground w-full hidden @compact:block">
            Press Enter to send, Shift + Enter for new line
            {directory && " • @ or / to mention files"}
            {" • Tab to switch agent"}
            {" • Cmd/Ctrl + M for model"}
          </div>
        </div>
      </div>
    </div>
  );
});
