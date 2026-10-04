import { useState } from "react";
import { ChevronRight, MessageCircle, Terminal } from "lucide-react";
import { useTabStore } from "@/stores/tabStore";
import { useDefaultProviderStore } from "@/stores/defaultProviderStore";
import { useRecentDirectoryStore } from "@/stores/recentDirectoryStore";
import { useCreateTempWorkspace } from "@/hooks/queries";
import { ChatCreateDialog } from "../tabs/implementations/chat/ChatCreateDialog";

export function QuickActions() {
  const addTab = useTabStore((s) => s.addTab);
  const defaultProviderId = useDefaultProviderStore((s) => s.defaultProviderId);
  const pushRecentDirectory = useRecentDirectoryStore((s) => s.push);
  const createTempWorkspace = useCreateTempWorkspace();
  const [projectChatOpen, setProjectChatOpen] = useState(false);

  const handleAskAnything = () => {
    createTempWorkspace.mutate(undefined, {
      onSuccess: ({ name, directory }) => {
        pushRecentDirectory(directory);
        addTab("chat", {
          providerId: defaultProviderId,
          sessionId: null,
          workspaceId: null,
          directory,
          sessionName: name,
        });
      },
    });
  };

  return (
    <section className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <button
        type="button"
        onClick={handleAskAnything}
        disabled={createTempWorkspace.isPending}
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
        onClick={() => setProjectChatOpen(true)}
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

      <ChatCreateDialog
        open={projectChatOpen}
        onOpenChange={setProjectChatOpen}
      />
    </section>
  );
}
