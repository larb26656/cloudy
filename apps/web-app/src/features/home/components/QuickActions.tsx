import { ChevronRight, MessageCircle, Terminal } from "lucide-react";
import { useNewChat } from "@/hooks/useNewChat";

interface QuickActionsProps {
  onOpenProjectChat: () => void;
}

export function QuickActions({ onOpenProjectChat }: QuickActionsProps) {
  const { create } = useNewChat();

  const handleAskAnything = () => {
    create({ providerId: "cloudy", directory: "", sessionName: "Cloudy Chat" });
  };

  return (
    <section className="mb-9 grid grid-cols-2 gap-3 sm:gap-4">
      <button
        type="button"
        onClick={handleAskAnything}
        className="group flex flex-col rounded-xl border border-primary/25 bg-primary/10 p-3 text-left transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 sm:p-5"
      >
        <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground sm:mb-4 sm:size-10">
          <MessageCircle className="size-5" />
        </div>
        <h2 className="flex w-full items-center justify-between text-sm font-semibold sm:mb-1 sm:text-lg">
          Ask anything
          <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground sm:block" />
        </h2>
        <p className="hidden text-sm text-muted-foreground sm:block">
          Quick chat with Cloudy. Powered by top models.
        </p>
      </button>

      <button
        type="button"
        onClick={onOpenProjectChat}
        className="group flex flex-col rounded-xl border border-success/25 bg-success/10 p-3 text-left transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-5"
      >
        <div className="mb-2 flex size-8 items-center justify-center rounded-lg border border-success/30 bg-success/15 text-success sm:mb-4 sm:size-10">
          <Terminal className="size-5" />
        </div>
        <h2 className="flex w-full items-center justify-between text-sm font-semibold sm:mb-1 sm:text-lg">
          Work on a project
          <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground sm:block" />
        </h2>
        <p className="hidden text-sm text-muted-foreground sm:block">
          Agent in your workspace. Use tools, edit files, and more.
        </p>
      </button>
    </section>
  );
}
