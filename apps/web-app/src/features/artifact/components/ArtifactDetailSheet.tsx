import { Info, X } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { ArtifactInfoDialog } from "@/features/artifact/components/ArtifactInfoDialog";
import type { Artifact } from "@/features/artifact/types";
import { env } from "@/config/env";
import { Button } from "@/components/ui/button";
import { SHEET_SIZE_CLASSES } from "@/constants/sheet";
import { cn } from "@/lib/utils";

interface ArtifactDetailSheetProps {
  artifact: Artifact | null;
  onClose: () => void;
}

export function ArtifactDetailSheet({
  artifact,
  onClose,
}: ArtifactDetailSheetProps) {
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const artifactUrl = artifact
    ? `${env.API_URL}/api/artifact/${artifact.fileName}`
    : "";

  return (
    <>
      <Dialog open={!!artifact} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className={cn("flex flex-col p-0 gap-0", SHEET_SIZE_CLASSES)}
          showCloseButton={false}
        >
          <DialogHeader className="h-12 px-4 border-b flex flex-row items-center justify-between flex-none">
            <div className="flex items-center gap-2 text-base font-medium min-w-0">
              <span className="truncate">{artifact?.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInfoDialog(true)}
                className="flex items-center gap-1"
              >
                <Info className="size-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="size-4" />
              </Button>
            </div>
          </DialogHeader>

          {artifact && (
            <iframe
              src={artifactUrl}
              className="flex-1 w-full border-0"
              title={artifact.name}
              sandbox="allow-scripts allow-same-origin"
            />
          )}
        </DialogContent>
      </Dialog>

      <ArtifactInfoDialog
        artifact={artifact}
        open={showInfoDialog}
        onOpenChange={setShowInfoDialog}
      />
    </>
  );
}
