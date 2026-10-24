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
    <section className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <button
        type="button"
        onClick={handleAskAnything}
        className="group flex flex-col rounded-xl border border-primary/25 bg-primary/10 p-5 text-left transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
      >
        <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <MessageCircle className="size-5" />
        </div>
        <h2 className="mb-1 flex w-full items-center justify-between text-lg font-semibold">
          Ask anything
          <ChevronRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        </h2>
        <p className="text-sm text-muted-foreground">
          Quick chat with Cloudy. Powered by top models.
        </p>
      </button>

      <button
        type="button"
        onClick={onOpenProjectChat}
        className="group flex flex-col rounded-xl border border-success/25 bg-success/10 p-5 text-left transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-success/30 bg-success/15 text-success">
          <Terminal className="size-5" />
        </div>
        <h2 className="mb-1 flex w-full items-center justify-between text-lg font-semibold">
          Work on a project
          <ChevronRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        </h2>
        <p className="text-sm text-muted-foreground">
          Agent in your workspace. Use tools, edit files, and more.
        </p>
      </button>
    </section>
  );
}
