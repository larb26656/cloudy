import { createFileRoute } from "@tanstack/react-router";
import { AppearanceSettings } from "@/features/settings/components/AppearanceSettings";
import { SettingsDetailHeader } from "@/features/settings/SettingsDetailHeader";

function AppearanceSettingsPage() {
  return (
    <div className="min-h-full">
      <SettingsDetailHeader title="Appearance" />
      <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-8">
        <AppearanceSettings />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/settings/appearance")({
  component: AppearanceSettingsPage,
});
