import { FileCode, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@cloudy/ui";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { TypeBadge } from "@/features/artifact/components";
import type { Artifact } from "@/features/artifact/types";
import DialogScrollArea from "@/components/layout/DialogScrollArea";

interface ArtifactInfoDialogProps {
  artifact: Artifact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArtifactInfoDialog({
  artifact,
  open,
  onOpenChange,
}: ArtifactInfoDialogProps) {
  if (!artifact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-3 border-b flex-none">
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="size-5" />
            {artifact.name}
          </DialogTitle>
        </DialogHeader>
        <DialogScrollArea isLimitSize={true} className="flex-1">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge type={artifact.meta.type} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {artifact.meta.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                  >
                    <Tag className="size-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="font-content">
              <MarkdownRenderer content={artifact.markdown} />
            </div>
          </div>
        </DialogScrollArea>
      </DialogContent>
    </Dialog>
  );
}
