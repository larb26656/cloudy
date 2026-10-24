import { createFileRoute } from "@tanstack/react-router";
import { PinnedAgentsSettings } from "@/features/settings/components/PinnedAgentsSettings";
import { SettingsDetailHeader } from "@/features/settings/SettingsDetailHeader";

function PinnedAgentsSettingsPage() {
  return (
    <div className="min-h-full">
      <SettingsDetailHeader title="Pinned Agents" />
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <PinnedAgentsSettings />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/settings/pinned-agents")({
  component: PinnedAgentsSettingsPage,
});
