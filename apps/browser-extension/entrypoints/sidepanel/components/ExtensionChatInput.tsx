import { ArrowUp, Square } from "lucide-react";
import type { FormEvent, KeyboardEvent } from "react";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";

interface ExtensionChatInputProps {
  value: string;
  isGenerating: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
}

export function ExtensionChatInput({
  value,
  isGenerating,
  onChange,
  onSubmit,
  onStop,
}: ExtensionChatInputProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onStop();
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <div className="composer-inner">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Cloudy..."
          rows={1}
          aria-label="Message Cloudy"
          className="composer-textarea"
        />
        <div className="composer-actions">
          {isGenerating ? (
            <Button
              type="button"
              onClick={onStop}
              size="icon"
              className="rounded-full"
              title="Stop generating"
              aria-label="Stop generating"
            >
              <Square className="size-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!value.trim()}
              size="icon"
              className="rounded-full"
              title="Send message"
              aria-label="Send message"
            >
              <ArrowUp className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <p className="composer-hint">
        Press Enter to send, Shift + Enter for new line
      </p>
    </form>
  );
}
