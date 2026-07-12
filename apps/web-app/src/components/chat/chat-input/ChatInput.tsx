import { useState, useEffect, useRef } from "react";
import { ArrowUp, Square } from "lucide-react";
import { ModelSelector } from "../ModelSelector";
import { AgentSelector } from "../AgentSelector";
import type { ModelConfig } from "../../../types";
import { Button } from "@/components/ui/button";
import { type ChatInputContent } from "@/lib/opencode";
import { ChatInputEditor } from "../ChatInputEditor";
import SpeechBtn from "./SpeechBtn";

interface ChatInputProps {
  onSend: (
    content: ChatInputContent,
    model?: ModelConfig | null,
    agent?: string | null,
  ) => void;
  onImmediateCommand?: (commandName: string) => void;
  onAbort?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  directory?: string;
  initialValue?: string;
  showModelSelector?: boolean;
}

const MOCK_HISTORY: string[] = [];

export function ChatInput({
  onSend,
  onImmediateCommand,
  onAbort,
  isLoading,
  placeholder = "Type a message...",
  directory,
  initialValue,
  showModelSelector = true,
}: ChatInputProps) {
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [chatInputContent, setChatInputContent] = useState<ChatInputContent>({
    text: "",
    mentions: [],
  });

  const [isListening, setIsListening] = useState(false);
  const [speechDraft, setSpeechDraft] = useState("");

  const speechBaseRef = useRef("");
  const prevListeningRef = useRef(false);

  const currentHistorySelectValue =
    historyIndex === -1 ? "" : MOCK_HISTORY[historyIndex] ?? "";

  useEffect(() => {
    if (initialValue) {
      setChatInputContent({ text: initialValue, mentions: [] });
      setSpeechDraft("");
      speechBaseRef.current = initialValue;
    }
  }, [initialValue]);

  useEffect(() => {
    setChatInputContent({ text: currentHistorySelectValue, mentions: [] });
  }, [historyIndex]);

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
    onImmediateCommand?.(commandName);
    setChatInputContent({ text: "", mentions: [] });
  };

  const handleSubmit = () => {
    const finalText = displayText.trim();
    if (finalText && !isLoading) {
      onSend(
        { ...chatInputContent, text: finalText },
        null,
        null,
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
      setHistoryIndex((i) => (i === -1 ? MOCK_HISTORY.length - 1 : Math.max(0, i - 1)));
    } else if (e.key === "ArrowDown") {
      setHistoryIndex((i) =>
        i === -1 || i === MOCK_HISTORY.length - 1 ? -1 : i + 1,
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 bg-muted border rounded-2xl px-4 py-2 w-full">
            <div className="flex gap-2 w-full pt-2">
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
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-between gap-2">
              <div className="flex gap-2 min-w-0 overflow-x-auto items-center">
                <AgentSelector />
                {showModelSelector && <ModelSelector />}
              </div>

              <div className="flex gap-2 shrink-0">
                <SpeechBtn
                  onTranscript={(text) => setSpeechDraft(text)}
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
