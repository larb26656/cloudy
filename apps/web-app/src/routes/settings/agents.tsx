import { createFileRoute } from "@tanstack/react-router";
import { SettingsDetailHeader } from "@/features/settings/SettingsDetailHeader";
import { CloudyAgentSettings } from "@/features/settings/components/CloudyAgentSettings";

function AgentsSettingsPage() {
  return (
    <div className="min-h-full">
      <SettingsDetailHeader title="Cloudy Agents" />
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <CloudyAgentSettings />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/settings/agents")({
  component: AgentsSettingsPage,
});
