// components/chat/ChatInput.tsx
import { useState, useEffect } from "react";
import { ArrowUp, Square } from "lucide-react";
import { ModelSelector } from "../ModelSelector";
import { AgentSelector } from "../AgentSelector";
import type { ModelConfig } from "../../../types";
import { Button } from "@/components/ui/button";
import { useAgentStore, useModelStore } from "@/stores";
import type { ChatInputContent } from "@/lib/opencode";
import { ChatInputEditor } from "../ChatInputEditor";
import SpeechBtn from "./SpeechBtn";

interface ChatInputProps {
  onSend: (
    content: ChatInputContent,
    model?: ModelConfig | null,
    agent?: string | null,
  ) => void;
  onAbort?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  directory?: string;
  initialValue?: string;
}

export function ChatInput({
  onSend,
  onAbort,
  isLoading,
  placeholder = "Type a message...",
  directory,
  initialValue,
}: ChatInputProps) {
  const [chatInputContent, setChatInputContent] = useState<ChatInputContent>({
    text: "",
    mentions: [],
  });
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (initialValue) {
      setChatInputContent({
        text: initialValue,
        mentions: [],
      });
    }
  }, [initialValue]);
  const { selectedModel } = useModelStore();
  const { selectedAgent } = useAgentStore();

  const handleSubmit = () => {
    const text = chatInputContent.text.trim();
    if (text && !isLoading) {
      onSend(chatInputContent, selectedModel, selectedAgent);
      setChatInputContent({
        text: "",
        mentions: [],
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "@" || e.key === "/") {
      if (directory) {
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 bg-muted border rounded-2xl px-4 py-2 w-full">
            <div className="flex gap-2 w-full pt-2">
              <ChatInputEditor
                content={chatInputContent}
                onChange={setChatInputContent}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-between">
              <div className="flex gap-1">
                <AgentSelector />
                <ModelSelector />
              </div>
              <div className="flex gap-2">
                <SpeechBtn
                  onTranscript={(text) =>
                    setChatInputContent((prev) => ({ ...prev, text }))
                  }
                  onListeningChange={setIsListening}
                />
                {isLoading ? (
                  <Button
                    size="icon"
                    className="rounded-full p-4"
                    onClick={onAbort}
                    title="Stop generating"
                  >
                    <Square className="size-5" />
                  </Button>
                ) : !isListening ? (
                  <Button
                    size="icon"
                    className="rounded-full p-4"
                    onClick={handleSubmit}
                    disabled={!chatInputContent.text.trim()}
                    title="Send message"
                  >
                    <ArrowUp className="size-5" />
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="text-center mt-2 text-xs text-muted-foreground w-full hidden md:block">
            Press Enter to send, Shift + Enter for new line
            {directory && " • @ or / to mention files"}
            {" • Cmd/Ctrl + M for model"}
          </div>
        </div>
      </div>
    </div>
  );
}
