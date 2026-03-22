import { Lightbulb, Tag } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { StatusBadge, PriorityBadge } from "@/features/idea/components";
import type { Idea } from "@/features/idea/types";
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

interface IdeaDetailSheetProps {
  idea: Idea | null;
  onClose: () => void;
}

function Header({ idea }: { idea: Idea }) {
  return (
    <div className="flex gap-2">
      <Lightbulb className="size-5" />
      {idea.name}
    </div>
  );
}

function Description({ idea }: { idea: Idea }) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={idea.meta.status} />
        <PriorityBadge priority={idea.meta.priority} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {idea.meta.tags.map((tag) => (
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

function Content({ idea }: { idea: Idea }) {
  return (
    <div className="font-content">
      <MarkdownRenderer content={idea.markdown} />
    </div>
  );
}

export function IdeaDetailSheet({ idea, onClose }: IdeaDetailSheetProps) {
  const isSmallScreen = useIsSmallScreen(1024);

  if (isSmallScreen) {
    return (
      <Dialog open={!!idea} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-full md:max-w-2xl ">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle> {idea && <Header idea={idea} />}</DialogTitle>
            <DialogDescription>
              {idea && <Description idea={idea} />}
            </DialogDescription>
          </DialogHeader>
          <DialogScrollArea>{idea && <Content idea={idea} />}</DialogScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={!!idea} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader className="pb-3 border-b">
          <SheetTitle className="flex items-center gap-2">
            {idea && <Header idea={idea} />}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            {idea && <Description idea={idea} />}
          </SheetDescription>
        </SheetHeader>
        <SheetScrollArea>{idea && <Content idea={idea} />}</SheetScrollArea>
      </SheetContent>
    </Sheet>
  );
}
