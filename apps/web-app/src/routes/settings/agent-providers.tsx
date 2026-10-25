import { createFileRoute } from "@tanstack/react-router";
import { AgentProviderSettings } from "@/features/settings/components/AgentProviderSettings";
import { SettingsDetailHeader } from "@/features/settings/SettingsDetailHeader";
import { BoxContainer } from "@/components/layout/BoxContainer";

function AgentProviderSettingsPage() {
  return (
    <div className="min-h-full">
      <SettingsDetailHeader title="Agent Providers" />
      <BoxContainer variant="settings">
        <AgentProviderSettings />
      </BoxContainer>
    </div>
  );
}

export const Route = createFileRoute("/settings/agent-providers")({
  component: AgentProviderSettingsPage,
});
