import type { Part } from "@opencode-ai/sdk/v2";
import { Bot, Zap, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SessionViewDialog } from "@/components/chat/dialogs/SessionViewDialog";
import CollapsiblePart from "./CollapsiblePart";

export type SubtaskPart = Extract<Part, { type: "subtask" }>;

interface SubtaskPartProps {
  part: SubtaskPart;
}

export function SubtaskPart({ part }: SubtaskPartProps) {
  const detail = part.agent || part.description?.slice(0, 30) || "";
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <CollapsiblePart
        label="Subtask"
        detail={detail}
        trailing={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
            onClick={() => setDialogOpen(true)}
          >
            <ExternalLink className="size-3.5" />
          </Button>
        }
      >
        <Card>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Subtask
                </span>
              </div>
              {part.agent && (
                <div className="flex items-center gap-2">
                  <Bot className="size-3 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {part.agent}
                  </span>
                </div>
              )}
              {part.description && (
                <div className="text-sm">
                  {part.description}
                </div>
              )}
              {part.prompt && (
                <div className="text-xs font-mono bg-muted rounded p-2 overflow-x-auto">
                  {part.prompt}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </CollapsiblePart>
      <SessionViewDialog
        sessionId={part.sessionID}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
