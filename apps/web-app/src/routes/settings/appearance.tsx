import { createFileRoute } from "@tanstack/react-router";
import { AppearanceSettings } from "@/features/settings/components/AppearanceSettings";
import { SettingsDetailHeader } from "@/features/settings/SettingsDetailHeader";
import { BoxContainer } from "@/components/layout/BoxContainer";

function AppearanceSettingsPage() {
  return (
    <div className="min-h-full">
      <SettingsDetailHeader title="Appearance" />
      <BoxContainer variant="settings" className="space-y-8">
        <AppearanceSettings />
      </BoxContainer>
    </div>
  );
}

export const Route = createFileRoute("/settings/appearance")({
  component: AppearanceSettingsPage,
});
