import { createFileRoute } from "@tanstack/react-router";
import { NetworkSettings } from "@/features/settings/components/NetworkSettings";
import { SettingsDetailHeader } from "@/features/settings/SettingsDetailHeader";
import { BoxContainer } from "@/components/layout/BoxContainer";

function NetworkSettingsPage() {
  return (
    <div className="min-h-full">
      <SettingsDetailHeader title="Network" />
      <BoxContainer variant="settings" className="space-y-8">
        <NetworkSettings />
      </BoxContainer>
    </div>
  );
}

export const Route = createFileRoute("/settings/network")({
  component: NetworkSettingsPage,
});
