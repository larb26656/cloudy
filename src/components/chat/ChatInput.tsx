// components/chat/ChatInput.tsx
import { useState, useRef, useEffect } from "react";
import { Send, ArrowUp, StopCircle } from "lucide-react";
import { ModelSelector } from "./ModelSelector";
import { FileMentionDropdown } from "./FileMentionDropdown";
import { useMessageStore } from "../../stores/messageStore";
import type { FileReference, ModelConfig } from "../../types";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (text: string, model?: ModelConfig | null) => void;
  onAbort?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  directory?: string;
}

export function ChatInput({
  onSend,
  onAbort,
  isLoading,
  placeholder = "Type a message...",
  directory,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [isFileMentionOpen, setIsFileMentionOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileReference[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { selectedModel } = useMessageStore();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [text]);

  const handleSubmit = () => {
    if (text.trim() && !isLoading) {
      let finalText = text.trim();
      if (selectedFiles.length > 0) {
        const fileMentions = selectedFiles.map((f) => `@${f.path}`).join(" ");
        finalText = `${fileMentions} ${finalText}`;
      }

      onSend(finalText, selectedModel);
      setText("");
      setSelectedFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);

    if (directory && (value.endsWith("@") || value.endsWith("/"))) {
      setIsFileMentionOpen(true);
    }
  };

  const handleFileSelect = (files: FileReference[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
    setText((prev) => prev.slice(0, -1));
  };

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 bg-muted border rounded-2xl px-4 py-2 w-full">
            <div className="flex gap-2 w-full">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={1}
                disabled={isLoading}
                className="bg-transparent border-none resize-none outline-none text-content py-2.5 min-h-[44px] max-h-[200px] w-full"
              />
            </div>

            <div className="flex justify-between">
              <ModelSelector />
              {isLoading ? (
                <Button
                  variant="ghost"
                  className="rounded-full p-4"
                  size="icon"
                  onClick={onAbort}
                  title="Stop generating"
                >
                  <StopCircle className="size-5" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  className="rounded-full p-4"
                  onClick={handleSubmit}
                  disabled={!text.trim() && selectedFiles.length === 0}
                  title="Send message"
                >
                  <ArrowUp className="size-5" />
                </Button>
              )}
            </div>
          </div>

          {/* <div className="relative">
          <div className="relative flex items-end gap-2 bg-muted border rounded-2xl p-2 transition-all"></div>

          {directory && (
            <div className="absolute left-12 bottom-full mb-2 w-80">
              <FileMentionDropdown
                directory={directory}
                isOpen={isFileMentionOpen}
                onClose={() => setIsFileMentionOpen(false)}
                onSelect={handleFileSelect}
              />
            </div>
          )}
        </div> */}

          <div className="text-center mt-2 text-xs text-muted-foreground w-full">
            Press Enter to send, Shift + Enter for new line
            {directory && " • @ or / to mention files"}
            {" • Cmd/Ctrl + M for model"}
          </div>
        </div>
      </div>
    </div>
  );
}
