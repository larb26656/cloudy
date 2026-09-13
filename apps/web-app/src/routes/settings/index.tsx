import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { EmptyState } from "@repo/ui/components/empty-state";

function SettingsIndexPage() {
  return (
    <EmptyState
      icon={Settings}
      title="Select a setting from the menu on the left."
      className="hidden h-full md:flex"
    />
  );
}

export const Route = createFileRoute("/settings/")({
  component: SettingsIndexPage,
});
