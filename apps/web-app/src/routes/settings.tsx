import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SettingsLayout } from "@/features/settings/components/SettingsLayout";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { SettingsMenu } from "@/features/settings/components/SettingsMenu";
import { useDeviceType } from "@/hooks";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { isMobile } = useDeviceType();

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <SettingsHeader title="Settings" />
        <SettingsMenu className="flex-1 overflow-y-auto p-4" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <SettingsHeader title="Settings" />
      <div className="flex-1 overflow-hidden">
        <SettingsLayout
          menu={<SettingsMenu className="h-full" />}
          detail={<Outlet />}
        />
      </div>
    </div>
  );
}
