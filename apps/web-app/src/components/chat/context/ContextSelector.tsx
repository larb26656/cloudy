import { useState } from "react";
import { Clipboard, ChevronDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useContextStore } from "@/stores/contextStore";
import { Button } from "@/components/ui/button";

export function ContextSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const addContext = useContextStore((s) => s.addContext);

  const handleAddClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      const result = await window.electronAPI?.context.addContext({
        type: "clipboard",
        data: {
          label: `Clipboard: ${text.slice(0, 50)}${
            text.length > 50 ? "..." : ""
          }`,
          content: text,
        },
        replace: true,
      });

      if (result) {
        addContext({
          id: result.id,
          type: "clipboard",
          data: {
            label: `Clipboard: ${text.slice(0, 50)}${
              text.length > 50 ? "..." : ""
            }`,
            content: text,
          },
          replace: true,
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      // Clipboard access denied or unavailable
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            size="icon-sm"
            variant={"outline"}
            className="rounded-full p-4"
            title="Stop generating"
          >
            <Plus className="size-5" />
          </Button>
        }
      >
        <Clipboard className="size-3.5" />
        <span>Context</span>
        <ChevronDown className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={handleAddClipboard}>
          <Clipboard className="size-4 mr-2" />
          Clipboard content
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
