import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FilePreview } from "./FilePreview";

interface FullFileDialogProps {
  directory: string;
  path: string | null;
  onClose: () => void;
}

export function FullFileDialog({
  directory,
  path,
  onClose,
}: FullFileDialogProps) {
  return (
    <Dialog
      open={Boolean(path)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[calc(100%-2rem)] lg:h-[90dvh] lg:max-h-[90dvh] lg:max-w-[90vw]">
        <DialogHeader className="shrink-0 border-b px-4 py-3 pr-14">
          <DialogTitle className="truncate font-mono text-sm">
            {path}
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1">
          <FilePreview directory={directory} path={path} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
