import {
  ArrowUp,
  Globe,
  Plus,
  Quote,
  Square,
  StickyNote,
  X,
} from "lucide-react";
import type { KeyboardEvent } from "react";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { useMessageScroller } from "@repo/ui/components/message-scroller";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import type { SelectionDraft } from "../hooks/useSelectedText";
import type { ContextAttachment } from "../lib/opencode/context";
import { formatContextAttachmentSize } from "../lib/opencode/context";
import type { Model } from "./ModelSelector";
import { ModelSelector } from "./ModelSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";

interface ChatInputProps {
  value: string;
  isGenerating: boolean;
  directory: string;
  model: Model | null;
  pageContext: ContextAttachment | null;
  selectionDraft: SelectionDraft | null;
  onChange: (value: string) => void;
  onModelChange: (model: Model | null) => void;
  onSubmit: () => void;
  onStop: () => void;
  onAddPageAttachment: () => void;
  onDismissSelection: () => void;
  onRemovePageContext: () => void;
}

function getPageContextTooltip(pageContext: ContextAttachment): string {
  return [pageContext.sourceUrl, pageContext.title]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function PageContextChip({
  pageContext,
  onRemovePageContext,
}: {
  pageContext: ContextAttachment;
  onRemovePageContext: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background py-0.5 pl-2 pr-1 text-xs">
            <Globe className="size-3 shrink-0 text-muted-foreground" />
            <span className="max-w-48 truncate font-medium">
              {pageContext.label}
            </span>
            <span className="shrink-0 text-muted-foreground">
              {formatContextAttachmentSize(pageContext.content)}
            </span>
            <button
              type="button"
              onClick={onRemovePageContext}
              className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Remove ${pageContext.label} page context`}
            >
              <X className="size-3" />
            </button>
          </div>
        }
      />
      <TooltipContent>{getPageContextTooltip(pageContext)}</TooltipContent>
    </Tooltip>
  );
}

function SelectionChip({
  selectionDraft,
  onDismissSelection,
}: {
  selectionDraft: SelectionDraft;
  onDismissSelection: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-dashed border-border bg-background py-0.5 pl-2 pr-1 text-xs">
            <Quote className="size-3 shrink-0 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Selection</span>
            <span className="shrink-0 text-muted-foreground">
              {formatContextAttachmentSize(selectionDraft.text)}
            </span>
            <button
              type="button"
              onClick={onDismissSelection}
              className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Dismiss selected text"
            >
              <X className="size-3" />
            </button>
          </div>
        }
      />
      <TooltipContent>{selectionDraft.text}</TooltipContent>
    </Tooltip>
  );
}

function AddContextBtn({
  onAddPageAttachment,
}: {
  onAddPageAttachment: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Add context">
            <Plus />
          </Button>
        }
      >
        Open
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40">
        <DropdownMenuItem onClick={onAddPageAttachment}>
          <StickyNote />
          Page Context
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ChatInput({
  value,
  isGenerating,
  directory,
  model,
  pageContext,
  selectionDraft,
  onChange,
  onModelChange,
  onSubmit,
  onStop,
  onAddPageAttachment,
  onDismissSelection,
  onRemovePageContext,
}: ChatInputProps) {
  const { scrollToEnd } = useMessageScroller();

  const handleSubmit = () => {
    if (!value.trim() || isGenerating) return;
    scrollToEnd();
    onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape" && isGenerating && !value.trim()) {
      event.preventDefault();
      onStop();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4">
      <div className="mx-auto max-w-4xl">
        <div className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-muted px-4 py-2">
          {(pageContext || selectionDraft) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {pageContext && (
                <PageContextChip
                  pageContext={pageContext}
                  onRemovePageContext={onRemovePageContext}
                />
              )}
              {selectionDraft && (
                <SelectionChip
                  selectionDraft={selectionDraft}
                  onDismissSelection={onDismissSelection}
                />
              )}
            </div>
          )}
          {pageContext && (
            <p className="text-[11px] leading-snug text-muted-foreground">
              Page context is sent with your next message and retained in this
              chat session, hidden from the transcript.
            </p>
          )}

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
            <div className="flex min-w-0 items-center gap-1">
              <AddContextBtn onAddPageAttachment={onAddPageAttachment} />
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
