import { Outlet, useMatch } from "@tanstack/react-router";
import { SettingsNavigation } from "./SettingsNavigation";

export function SettingsLayout() {
  const indexMatch = useMatch({
    from: "/settings/",
    shouldThrow: false,
  });
  const isIndexRoute = Boolean(indexMatch);

  return (
    <div className="h-full">
      <div className="hidden h-full md:grid md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="min-w-0 border-r">
          <SettingsNavigation />
        </div>
        <main className="min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <div className="h-full md:hidden">
        {isIndexRoute ? <SettingsNavigation /> : <Outlet />}
      </div>
    </div>
  );
}
