import { createFileRoute } from "@tanstack/react-router";
import { SettingsLayout } from "@/features/settings/components/SettingsLayout";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { SettingsMenu } from "@/features/settings/components/SettingsMenu";
import { PersonalizeSection } from "@/features/settings/components/sections/PersonalizeSection";
import { useDeviceType } from "@/hooks";

export const Route = createFileRoute("/settings/personalize")({
  component: PersonalizePage,
});

function PersonalizePage() {
  const { isMobile } = useDeviceType();

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <SettingsHeader title="Personalize" showBackButton />
        <div className="flex-1 overflow-y-auto p-4">
          <PersonalizeSection />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-xl font-semibold mb-6">Personalize</h2>
      <PersonalizeSection />
    </div>
  );
}
