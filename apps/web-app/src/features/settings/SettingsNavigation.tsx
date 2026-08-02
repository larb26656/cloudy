import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { settingsSections } from "./settingsConfig";

export function SettingsNavigation() {
  const location = useLocation();

  return (
    <nav className="flex h-full flex-col overflow-y-auto p-4">
      <div className="mb-4 flex items-center gap-1 px-1">
        <Link to="/">
          <Button variant="ghost" size="icon-sm" aria-label="Back to home">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      <div className="space-y-1">
        {settingsSections.map((section) => {
          const isActive = location.pathname === section.to;
          const Icon = section.icon;

          return (
            <Link
              key={section.id}
              to={section.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted",
                isActive && "bg-muted",
              )}
            >
              <Icon className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{section.label}</div>
                <div className="truncate text-sm text-muted-foreground">
                  {section.description}
                </div>
              </div>
              <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground md:hidden" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
