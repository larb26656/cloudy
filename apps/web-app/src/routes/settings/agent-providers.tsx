import { createFileRoute } from "@tanstack/react-router";
import { AgentProviderSettings } from "@/features/settings/components/AgentProviderSettings";
import { SettingsDetailHeader } from "@/features/settings/SettingsDetailHeader";

function AgentProviderSettingsPage() {
  return (
    <div className="min-h-full">
      <SettingsDetailHeader title="Agent Providers" />
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <AgentProviderSettings />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/settings/agent-providers")({
  component: AgentProviderSettingsPage,
});
