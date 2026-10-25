import { createFileRoute } from "@tanstack/react-router";
import { SettingsDetailHeader } from "@/features/settings/SettingsDetailHeader";
import { CloudyAgentSettings } from "@/features/settings/components/CloudyAgentSettings";
import { BoxContainer } from "@/components/layout/BoxContainer";

function AgentsSettingsPage() {
  return (
    <div className="min-h-full">
      <SettingsDetailHeader title="Cloudy Agents" />
      <BoxContainer variant="settings">
        <CloudyAgentSettings />
      </BoxContainer>
    </div>
  );
}

export const Route = createFileRoute("/settings/agents")({
  component: AgentsSettingsPage,
});
