import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";

function SettingsIndexPage() {
  return (
    <div className="hidden h-full items-center justify-center p-8 md:flex">
      <div className="text-center text-muted-foreground">
        <Settings className="mx-auto mb-3 size-10" />
        <p>Select a setting from the menu on the left.</p>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/settings/")({
  component: SettingsIndexPage,
});
