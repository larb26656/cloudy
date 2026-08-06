import { X } from "lucide-react";
import { MessageError } from "./MessageError";
import type { SessionErrorInfo } from "@/stores/sessionErrorStore";

interface SessionErrorMessageProps {
  error: SessionErrorInfo;
  onDismiss: () => void;
}

export function SessionErrorMessage({
  error,
  onDismiss,
}: SessionErrorMessageProps) {
  return (
    <div className="text-destructive flex items-start gap-2">
      <div className="flex-1">
        <MessageError error={error} />
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="mt-0.5 shrink-0 opacity-70 transition-opacity hover:opacity-100"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
