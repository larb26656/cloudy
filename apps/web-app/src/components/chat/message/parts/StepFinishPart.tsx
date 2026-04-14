import { useState } from "react";
import type {
  StepFinishPart as StepFinishPartType,
  AssistantMessage,
} from "@opencode-ai/sdk/v2";
import { Info, Eye } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { formatTime, formatNumber } from "@/lib/date";
import { useFileCacheStore } from "@/stores/fileCacheStore";
import { getStore } from "@/stores/instance";
import { traverseByParentId } from "@/lib/message/message";
import { extractFromMessages } from "@/lib/message/file-summarize";
import { FileUpdateViewerDialog } from "@/components/file-update-viewer/FileUpdateViewerDialog";

interface StepFinishPartProps {
  part: StepFinishPartType;
  info?: AssistantMessage;
}

export function StepFinishPart({ part, info }: StepFinishPartProps) {
  const [isOpen, setIsOpen] = useState(false);

  const totalTokens =
    part.tokens.input + part.tokens.output + part.tokens.reasoning;

  const isLastMessage = part.reason === "stop";

  const messageId = info?.id;
  const parentId = info?.parentID;

  const cachedFiles = useFileCacheStore((s) =>
    messageId ? s.getFiles(messageId) : null,
  );

  let files = cachedFiles ?? [];

  if (isLastMessage && cachedFiles === null && messageId && parentId) {
    const sessionId = info?.sessionID;
    const allMessages =
      getStore("message").getState().messages[sessionId ?? ""] ?? [];
    const messagesInChain = traverseByParentId(allMessages, parentId);
    const extractedFiles = extractFromMessages(messagesInChain);

    useFileCacheStore.getState().setFiles(messageId, extractedFiles);
    files = extractedFiles;
  }

  if (!isLastMessage) {
    return;
  }

  const finishTimestamp = info?.time.completed || new Date().getTime();

  return (
    <div className="flex flex-col gap-2">
      {files.length > 0 && (
        <div className="flex items-center gap-2">
          <p className="text-sm">
            File change{" "}
            <span className="text-muted-foreground">
              {files.length} file{files.length > 1 ? "s" : ""}
            </span>
          </p>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsOpen(true)}
            className="text-muted-foreground"
          >
            <Eye />
          </Button>
        </div>
      )}
      <div className="flex items-center gap-2">
        {finishTimestamp && (
          <span className="text-xs text-muted-foreground">
            {formatTime(finishTimestamp)}
          </span>
        )}

        {info?.modelID && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {info.modelID}
          </span>
        )}

        {info?.agent && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {info.agent}
          </span>
        )}

        <Tooltip>
          <TooltipTrigger className="inline-flex items-center justify-center rounded-md size-5 hover:bg-muted hover:text-foreground cursor-pointer">
            <Info className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent className="w-auto">
            <div className="space-y-1 text-xs">
              {part.cost > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Cost</span>
                  <span>${part.cost.toFixed(6)}</span>
                </div>
              )}
              {totalTokens > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Total Tokens</span>
                  <span>{formatNumber(totalTokens)}</span>
                </div>
              )}
              {part.tokens.input > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Input</span>
                  <span>{formatNumber(part.tokens.input)}</span>
                </div>
              )}
              {part.tokens.output > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Output</span>
                  <span>{formatNumber(part.tokens.output)}</span>
                </div>
              )}
              {part.tokens.reasoning > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Reasoning</span>
                  <span>{formatNumber(part.tokens.reasoning)}</span>
                </div>
              )}
              {part.tokens.cache.read > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Cache Read</span>
                  <span>{formatNumber(part.tokens.cache.read)}</span>
                </div>
              )}
              {part.tokens.cache.write > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Cache Write</span>
                  <span>{formatNumber(part.tokens.cache.write)}</span>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      <FileUpdateViewerDialog
        files={files}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
    </div>
  );
}
