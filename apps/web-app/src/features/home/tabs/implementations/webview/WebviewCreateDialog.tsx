import { useState } from "react";
import { useTabStore } from "@/stores/tabStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeUrl } from "./meta";

interface WebviewCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebviewCreateDialog({
  open,
  onOpenChange,
}: WebviewCreateDialogProps) {
  const addTab = useTabStore((s) => s.addTab);
  const [url, setUrl] = useState("");

  const handleOpen = () => {
    const normalized = normalizeUrl(url);
    if (!normalized) return;
    addTab("webview", { url: normalized });
    setUrl("");
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setUrl("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Open Webpage</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleOpen();
            }}
            placeholder="Enter URL (e.g., example.com)"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleOpen} disabled={!url.trim()}>
            Open
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
