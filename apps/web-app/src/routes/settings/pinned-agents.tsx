import { createFileRoute } from "@tanstack/react-router";
import { PinnedAgentsSettings } from "@/features/settings/components/PinnedAgentsSettings";
import { SettingsDetailHeader } from "@/features/settings/SettingsDetailHeader";
import { BoxContainer } from "@/components/layout/BoxContainer";

function PinnedAgentsSettingsPage() {
  return (
    <div className="min-h-full">
      <SettingsDetailHeader title="Pinned Agents" />
      <BoxContainer variant="settings">
        <PinnedAgentsSettings />
      </BoxContainer>
    </div>
  );
}

export const Route = createFileRoute("/settings/pinned-agents")({
  component: PinnedAgentsSettingsPage,
});
