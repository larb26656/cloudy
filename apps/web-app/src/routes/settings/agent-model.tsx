import { createFileRoute } from "@tanstack/react-router";
import { AgentModelSettings } from "@/features/settings/components/AgentModelSettings";
import { SettingsDetailHeader } from "@/features/settings/SettingsDetailHeader";
import { BoxContainer } from "@/components/layout/BoxContainer";

function AgentModelSettingsPage() {
  return (
    <div className="min-h-full">
      <SettingsDetailHeader title="Agent & Model" />
      <BoxContainer variant="settings" className="space-y-8">
        <AgentModelSettings />
      </BoxContainer>
    </div>
  );
}

export const Route = createFileRoute("/settings/agent-model")({
  component: AgentModelSettingsPage,
});
