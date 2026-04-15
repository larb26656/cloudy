import { createFileRoute } from "@tanstack/react-router";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { InstanceSection } from "@/features/settings/components/sections/InstanceSection";
import { useDeviceType } from "@/hooks";

export const Route = createFileRoute("/settings/instance")({
  component: InstancePage,
});

function InstancePage() {
  const { isMobile } = useDeviceType();

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <SettingsHeader title="Instance" showBackButton />
        <div className="flex-1 overflow-y-auto p-4">
          <InstanceSection />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <h2 className="text-xl font-semibold mb-6">Instance</h2>
      <InstanceSection />
    </div>
  );
}