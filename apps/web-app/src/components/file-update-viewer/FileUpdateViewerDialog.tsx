import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FileUpdateViewer, type FileItem } from "@/components/file-update-viewer";
import { SHEET_SIZE_CLASSES } from "@/constants/sheet";
import { cn } from "@/lib/utils";

interface FileUpdateViewerDialogProps {
  files: FileItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FileUpdateViewerDialog({
  files,
  isOpen,
  onOpenChange,
}: FileUpdateViewerDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("flex flex-col p-0 gap-0", SHEET_SIZE_CLASSES)}
        showCloseButton={false}
      >
        <FileUpdateViewer files={files} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
