import { FileText, Tag } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import type { Memory } from "@/features/memory/types";
import DialogScrollArea from "@/components/layout/DialogScrollArea";
import SheetScrollArea from "@/components/layout/SheetScrollArea";

function useIsSmallScreen(breakpoint = 1024) {
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsSmall(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsSmall(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [breakpoint]);

  return isSmall;
}

interface MemoryDetailSheetProps {
  memory: Memory | null;
  onClose: () => void;
}

function Header({ memory }: { memory: Memory }) {
  return (
    <div className="flex gap-2">
      <FileText className="size-5" />
      {memory.name}
    </div>
  );
}

function Description({ memory }: { memory: Memory }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {memory.meta.tags.map((tag) => (
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
  );
}

function Content({ memory }: { memory: Memory }) {
  return (
    <div className="font-content">
      <MarkdownRenderer content={memory.markdown} />
    </div>
  );
}

export function MemoryDetailSheet({ memory, onClose }: MemoryDetailSheetProps) {
  const isSmallScreen = useIsSmallScreen(1024);

  if (isSmallScreen) {
    return (
      <Dialog open={!!memory} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="flex flex-col max-w-screen h-screen rounded-none">
          <DialogHeader className="pb-3 border-b flex-none">
            <DialogTitle>{memory && <Header memory={memory} />}</DialogTitle>
            <DialogDescription asChild>
              {memory && <Description memory={memory} />}
            </DialogDescription>
          </DialogHeader>
          <DialogScrollArea>
            {memory && <Content memory={memory} />}
          </DialogScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={!!memory} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader className="pb-3 border-b">
          <SheetTitle className="flex items-center gap-2">
            {memory && <Header memory={memory} />}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2" asChild>
            {memory && <Description memory={memory} />}
          </SheetDescription>
        </SheetHeader>
        <SheetScrollArea>
          {memory && <Content memory={memory} />}
        </SheetScrollArea>
      </SheetContent>
    </Sheet>
  );
}
