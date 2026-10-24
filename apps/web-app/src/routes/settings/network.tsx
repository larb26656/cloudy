import { createFileRoute } from "@tanstack/react-router";
import { NetworkSettings } from "@/features/settings/components/NetworkSettings";
import { SettingsDetailHeader } from "@/features/settings/SettingsDetailHeader";

function NetworkSettingsPage() {
  return (
    <div className="min-h-full">
      <SettingsDetailHeader title="Network" />
      <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-8">
        <NetworkSettings />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/settings/network")({
  component: NetworkSettingsPage,
});
