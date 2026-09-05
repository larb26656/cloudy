import { ArrowUp, Paperclip, Square } from "lucide-react";
import { ModelSelector } from "../ModelSelector";
import { AgentSelector } from "../AgentSelector";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { type ChatInputContent, type ImageAttachment } from "@/lib/opencode";
import { cn } from "@/lib/utils";
import { getNextName } from "@/lib/cycleName";
import { useAgents } from "@/hooks/queries/useAgents";
import { ChatInputEditor } from "./ChatInputEditor";
import SpeechBtn from "./SpeechBtn";
import { AttachmentPreview } from "./AttachmentPreview";
import { useChat } from "../ChatProvider";
import { useChatInputHistoryStore } from "@/stores/chatInputHistoryStore";
import { useMessageScroller } from "@/components/ui/message-scroller";
import { memo, useEffect, useRef, useState } from "react";

interface ChatInputProps {
  placeholder?: string;
  initialValue?: string;
  initialAttachments?: ImageAttachment[];
}

const NO_HISTORY: string[] = [];
const MAX_ATTACHMENTS = 5;
const EMPTY_CONTENT: ChatInputContent = {
  text: "",
  mentions: [],
  attachments: [],
};

export const ChatInput = memo(function ChatInput({
  placeholder = "Type a message...",
  initialValue,
  initialAttachments,
}: ChatInputProps) {
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [chatInputContent, setChatInputContent] =
    useState<ChatInputContent>(EMPTY_CONTENT);

  const {
    effectiveModel,
    effectiveAgent,
    directory,
    sessionId,
    sendMessage,
    abortGeneration,
    executeImmediateCommand,
    setAgent,
    isSending,
    isStreaming,
  } = useChat();

  const { data: agents } = useAgents();

  const history = useChatInputHistoryStore((s) =>
    sessionId ? (s.sessions[sessionId] ?? NO_HISTORY) : NO_HISTORY,
  );

  const { scrollToEnd } = useMessageScroller();

  const [isListening, setIsListening] = useState(false);
  const [speechDraft, setSpeechDraft] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

  const speechBaseRef = useRef("");
  const prevListeningRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentHistorySelectValue =
    historyIndex === -1 ? "" : (history[historyIndex] ?? "");

  useEffect(() => {
    setHistoryIndex(-1);
  }, [sessionId]);

  useEffect(() => {
    if (initialValue || initialAttachments) {
      setChatInputContent({
        ...EMPTY_CONTENT,
        text: initialValue ?? "",
        attachments: initialAttachments ?? [],
      });
      setSpeechDraft("");
      speechBaseRef.current = initialValue ?? "";
    }
  }, [initialValue, initialAttachments]);

  useEffect(() => {
    setChatInputContent({
      ...EMPTY_CONTENT,
      text: currentHistorySelectValue,
    });
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

  const addImageFile = (file: File): boolean => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files can be attached");
      return false;
    }

    if (chatInputContent.attachments.length >= MAX_ATTACHMENTS) {
      toast.error("Up to 5 images per message");
      return false;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") return;
      const attachment: ImageAttachment = {
        id: crypto.randomUUID(),
        mime: file.type,
        filename: file.name,
        dataUrl,
      };
      setChatInputContent((prev) => ({
        ...prev,
        attachments: [...prev.attachments, attachment],
      }));
    };
    reader.readAsDataURL(file);
    return true;
  };

  const addFiles = (files: File[]) => {
    for (const file of files) {
      addImageFile(file);
    }
  };

  const removeAttachment = (id: string) => {
    setChatInputContent((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((a) => a.id !== id),
    }));
  };

  const handleImmediateExecute = (commandName: string) => {
    void executeImmediateCommand(commandName);
    setChatInputContent(EMPTY_CONTENT);
  };

  const handleSubmit = () => {
    const finalText = displayText.trim();
    const hasAttachments = chatInputContent.attachments.length > 0;
    if ((finalText || hasAttachments) && !isSending) {
      scrollToEnd();
      void sendMessage(
        { ...chatInputContent, text: finalText },
        effectiveModel,
        effectiveAgent,
      );
      setChatInputContent(EMPTY_CONTENT);
      setSpeechDraft("");
      setHistoryIndex(-1);
    }
  };

  const handleHistoryCursor = (e: React.KeyboardEvent) => {
    if (!history.length) return;
    if (chatInputContent.text !== currentHistorySelectValue) return;

    if (e.key === "ArrowUp") {
      setHistoryIndex((i) =>
        i === -1 ? history.length - 1 : Math.max(0, i - 1),
      );
    } else if (e.key === "ArrowDown") {
      setHistoryIndex((i) =>
        i === -1 || i === history.length - 1 ? -1 : i + 1,
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
    <div
      className="p-4 @container"
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) addFiles(files);
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-2">
          <div
            className={cn(
              "flex flex-col gap-2 bg-muted border rounded-2xl px-4 py-2 w-full",
              !isFocused &&
                "@max-compact:flex-row @max-compact:items-center min-w-0",
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setIsFocused(false);
              }
            }}
          >
            {isFocused && (
              <AttachmentPreview
                attachments={chatInputContent.attachments}
                onRemove={removeAttachment}
              />
            )}
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
                onAddFiles={addFiles}
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length > 0) addFiles(files);
                    e.target.value = "";
                  }}
                  aria-label="Attach image files"
                />
                {isFocused && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="rounded-full p-4"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending}
                    title="Attach images"
                    aria-label="Attach images"
                  >
                    <Paperclip className="size-5" />
                  </Button>
                )}

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
                    disabled={
                      !displayText.trim() &&
                      chatInputContent.attachments.length === 0
                    }
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
