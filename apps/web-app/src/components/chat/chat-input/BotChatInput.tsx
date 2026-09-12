import { ArrowUp, Square } from "lucide-react";
import { useState } from "react";
import { ModelSelector } from "../ModelSelector";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMessageScroller } from "@/components/ui/message-scroller";
import { useChat } from "../ChatProvider";

interface BotChatInputProps {
  placeholder?: string;
}

export function BotChatInput({
  placeholder = "Type a message...",
}: BotChatInputProps) {
  const [text, setText] = useState("");

  const {
    effectiveModel,
    effectiveAgent,
    sendMessage,
    abortGeneration,
    isSending,
    isStreaming,
  } = useChat();

  const { scrollToEnd } = useMessageScroller();

  const handleSubmit = () => {
    const finalText = text.trim();
    if (!finalText || isSending) return;

    scrollToEnd();
    void sendMessage(
      { text: finalText, mentions: [], attachments: [] },
      effectiveModel,
      effectiveAgent,
    );
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
      return;
    }

    if (e.key === "Escape" && isStreaming && !text.trim()) {
      e.preventDefault();
      abortGeneration();
    }
  };

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-2 bg-muted border rounded-2xl px-4 py-2 w-full">
          <div className="flex gap-2 w-full pt-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isSending}
              className="min-h-16 max-h-40 resize-none border-0 bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
          <div className="flex gap-2 justify-between">
            <div className="flex items-center min-w-0">
              <ModelSelector />
            </div>
            <div className="flex gap-2 shrink-0">
              {isStreaming && !text.trim() ? (
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
                  disabled={!text.trim()}
                  title="Send message"
                >
                  <ArrowUp className="size-5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mt-2 text-xs text-muted-foreground w-full">
          Press Enter to send, Shift + Enter for new line
        </div>
      </div>
    </div>
  );
}
