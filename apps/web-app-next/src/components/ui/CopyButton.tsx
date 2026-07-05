import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  onClick: () => void;
  copied: boolean;
}

export function CopyButton({ onClick, copied }: CopyButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-md size-5 hover:bg-muted hover:text-foreground cursor-pointer"
      aria-label="Copy message"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}
