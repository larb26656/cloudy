import type { LucideIcon } from "lucide-react";
import { Bot, FolderKanban, PlugZap } from "lucide-react";

export const appPages = {
  workspaces: {
    label: "Workspaces",
    description: "Organize projects and conversations in one place.",
    icon: FolderKanban,
  },
  agents: {
    label: "Agents",
    description: "Create and customize the agents that help you work.",
    icon: Bot,
  },
  providers: {
    label: "Providers",
    description: "Manage the AI providers and connections available to Cloudy.",
    icon: PlugZap,
  },
} as const satisfies Record<
  string,
  { label: string; description: string; icon: LucideIcon }
>;

export type AppPage = keyof typeof appPages;

export function AppPageContent({ page }: { page: AppPage }) {
  const { label, description, icon: Icon } = appPages[page];

  return (
    <main className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-6 py-10 md:px-10">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <Icon data-icon className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
