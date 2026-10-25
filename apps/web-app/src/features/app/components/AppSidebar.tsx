import { Link } from "@tanstack/react-router";
import { Cloud, Settings } from "lucide-react";
import { AppNav } from "./AppNav";

export function AppSidebar() {
  return (
    <aside className="hidden h-full w-14 shrink-0 flex-col border-r bg-sidebar md:flex lg:w-60">
      <div className="flex h-16 items-center justify-center text-base font-semibold tracking-tight lg:justify-start lg:gap-2 lg:px-5">
        <Cloud data-icon className="size-5 text-primary" />
        <span className="hidden lg:inline">Cloudy</span>
      </div>
      <AppNav compact className="p-1.5 lg:p-2" />
      <div className="mt-auto border-t p-1.5 lg:p-2">
        <Link
          to="/settings"
          title="Settings"
          aria-label="Settings"
          className="flex h-10 items-center justify-center rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 lg:justify-start lg:gap-2"
          activeProps={{ className: "bg-muted text-foreground" }}
        >
          <Settings data-icon className="size-4" />
          <span className="hidden lg:inline">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
