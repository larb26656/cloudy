import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { SettingsLayout } from "@/features/settings/components/SettingsLayout";
import { SettingsMenu } from "@/features/settings/components/SettingsMenu";
import { useDeviceType } from "@/hooks";
import { Header } from "@/components/layout";
import BackButton from "@/components/ui/back-button";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { isMobile } = useDeviceType();
  const location = useLocation();
  const isOnSettingsRoot = location.pathname === "/settings";

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {isOnSettingsRoot ? (
          <>
            <Header prefixActions={[<BackButton />]} title="Settings" />
            <SettingsMenu className="flex-1 overflow-y-auto p-4" />
          </>
        ) : (
          <Outlet />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header prefixActions={[<BackButton />]} title="Settings" />
      <div className="flex-1 overflow-hidden">
        <SettingsLayout
          menu={<SettingsMenu className="h-full" />}
          detail={<Outlet />}
        />
      </div>
    </div>
  );
}
