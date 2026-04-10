// components/chat/ChatInput.tsx
import { useState, useEffect, useRef } from "react";
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
  showModelSelector?: boolean;
}

export function ChatInput({
  onSend,
  onAbort,
  isLoading,
  placeholder = "Type a message...",
  directory,
  initialValue,
  showModelSelector = true,
}: ChatInputProps) {
  const [chatInputContent, setChatInputContent] = useState<ChatInputContent>({
    text: "",
    mentions: [],
  });

  const [isListening, setIsListening] = useState(false);
  const [speechDraft, setSpeechDraft] = useState("");

  const speechBaseRef = useRef("");
  const prevListeningRef = useRef(false);

  useEffect(() => {
    if (initialValue) {
      setChatInputContent({
        text: initialValue,
        mentions: [],
      });
      setSpeechDraft("");
      speechBaseRef.current = initialValue;
    }
  }, [initialValue]);

  useEffect(() => {
    if (isListening && !prevListeningRef.current) {
      speechBaseRef.current = chatInputContent.text;
    }

    if (!isListening && prevListeningRef.current) {
      const merged = `${speechBaseRef.current} ${speechDraft}`.trim();
      speechBaseRef.current = merged;

      setChatInputContent((prev) => ({
        ...prev,
        text: merged,
      }));

      setSpeechDraft("");
    }

    prevListeningRef.current = isListening;
  }, [isListening, speechDraft, chatInputContent.text]);

  const { selectedModel } = useModelStore();
  const { selectedAgent } = useAgentStore();

  const displayText = isListening
    ? `${speechBaseRef.current} ${speechDraft}`.trim()
    : chatInputContent.text;

  const handleSubmit = () => {
    const finalText = displayText.trim();

    if (finalText && !isLoading) {
      onSend(
        {
          ...chatInputContent,
          text: finalText,
        },
        selectedModel,
        selectedAgent,
      );

      setChatInputContent({
        text: "",
        mentions: [],
      });
      setSpeechDraft("");
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
                content={{
                  ...chatInputContent,
                  text: displayText,
                }}
                onChange={(next) => {
                  if (!isListening) {
                    setChatInputContent(next);
                    speechBaseRef.current = next.text;
                    return;
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-between gap-2">
              <div className="flex gap-2 min-w-0 overflow-x-auto">
                <AgentSelector />
                {showModelSelector && <ModelSelector />}
              </div>

              <div className="flex gap-2 shrink-0">
                <SpeechBtn
                  onTranscript={(text) => {
                    setSpeechDraft(text);
                  }}
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
                    disabled={!displayText.trim()}
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
