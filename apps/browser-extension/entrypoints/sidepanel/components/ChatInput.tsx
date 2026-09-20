import { ArrowUp, Square } from "lucide-react";
import type { KeyboardEvent } from "react";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { useMessageScroller } from "@repo/ui/components/message-scroller";
import type { Model } from "./ModelSelector";
import { ModelSelector } from "./ModelSelector";
import { Badge } from "@repo/ui/components/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";

interface ChatInputProps {
  value: string;
  isGenerating: boolean;
  directory: string;
  model: Model | null;
  selectedText: string | null;
  onChange: (value: string) => void;
  onModelChange: (model: Model | null) => void;
  onSubmit: () => void;
  onStop: () => void;
}

export function ChatInput({
  value,
  isGenerating,
  directory,
  model,
  selectedText,
  onChange,
  onModelChange,
  onSubmit,
  onStop,
}: ChatInputProps) {
  const { scrollToEnd } = useMessageScroller();

  function handleSubmit() {
    if (!value.trim() || isGenerating) return;
    scrollToEnd();
    onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape" && isGenerating && !value.trim()) {
      event.preventDefault();
      onStop();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="p-4">
      <div className="mx-auto max-w-4xl">
        <div className="flex w-full flex-col gap-2 rounded-2xl border bg-muted px-4 py-2">
          <div className="felx gap-2 overflow-y">
            {selectedText && (
              <Tooltip>
                <TooltipTrigger render={<Badge>1 Selection</Badge>} />
                <TooltipContent>{selectedText}</TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="flex w-full gap-2">
            <Textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Cloudy..."
              aria-label="Message Cloudy"
              disabled={isGenerating}
              className="min-h-16 max-h-40 resize-none border-0 bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
          <div className="flex justify-between gap-2">
            <div className="flex min-w-0 items-center">
              <ModelSelector
                directory={directory}
                value={model}
                onChange={onModelChange}
              />
            </div>
            <div className="flex shrink-0 gap-2">
              {isGenerating && !value.trim() ? (
                <Button
                  size="icon"
                  className="rounded-full p-4"
                  onClick={onStop}
                  title="Stop generating"
                  aria-label="Stop generating"
                >
                  <Square className="size-5" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  className="rounded-full p-4"
                  onClick={handleSubmit}
                  disabled={!value.trim() || isGenerating}
                  title="Send message"
                  aria-label="Send message"
                >
                  <ArrowUp className="size-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="mt-2 w-full text-center text-xs text-muted-foreground">
          Press Enter to send, Shift + Enter for new line
        </div>
      </div>
    </div>
  );
}
