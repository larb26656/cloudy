import { createFileRoute } from "@tanstack/react-router";
import { ProviderSettings } from "@/features/settings/components/ProviderSettings";
import { SettingsDetailHeader } from "@/features/settings/SettingsDetailHeader";

function ProviderSettingsPage() {
  return (
    <div className="min-h-full">
      <SettingsDetailHeader title="Providers" />
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <ProviderSettings />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/settings/providers")({
  component: ProviderSettingsPage,
});
