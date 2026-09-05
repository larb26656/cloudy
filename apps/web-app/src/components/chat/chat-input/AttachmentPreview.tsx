import { X } from "lucide-react";
import type { ImageAttachment } from "@/lib/opencode";

interface AttachmentPreviewProps {
  attachments: ImageAttachment[];
  onRemove: (id: string) => void;
}

export function AttachmentPreview({
  attachments,
  onRemove,
}: AttachmentPreviewProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1" data-testid="attachment-preview">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center gap-1 rounded-md border bg-background px-1 py-1 text-xs"
        >
          <img
            src={attachment.dataUrl}
            alt={attachment.filename}
            className="size-6 rounded object-cover"
          />
          <span className="max-w-[8rem] truncate">{attachment.filename}</span>
          <button
            type="button"
            onClick={() => onRemove(attachment.id)}
            aria-label={`Remove ${attachment.filename}`}
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
