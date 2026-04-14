import { createFileRoute } from "@tanstack/react-router";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { ModelSection } from "@/features/settings/components/sections/ModelSection";
import { useDeviceType } from "@/hooks";

export const Route = createFileRoute("/settings/model")({
  component: ModelPage,
});

function ModelPage() {
  const { isMobile } = useDeviceType();

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <SettingsHeader title="Model" showBackButton />
        <div className="flex-1 overflow-y-auto p-4">
          <ModelSection />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-xl font-semibold mb-6">Model</h2>
      <ModelSection />
    </div>
  );
}
