import { createFileRoute } from "@tanstack/react-router";
import { AgentModelSettings } from "@/features/settings/components/AgentModelSettings";
import { SettingsDetailHeader } from "@/features/settings/SettingsDetailHeader";

function AgentModelSettingsPage() {
  return (
    <div className="min-h-full">
      <SettingsDetailHeader title="Agent & Model" />
      <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-8">
        <AgentModelSettings />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/settings/agent-model")({
  component: AgentModelSettingsPage,
});
