import { createFileRoute } from "@tanstack/react-router";
import { QuickPhrasesSettings } from "@/features/settings/components/QuickPhrasesSettings";
import { SettingsDetailHeader } from "@/features/settings/SettingsDetailHeader";

function QuickPhrasesSettingsPage() {
  return (
    <div className="min-h-full">
      <SettingsDetailHeader title="Quick Phrases" />
      <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-8">
        <QuickPhrasesSettings />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/settings/quick-phrases")({
  component: QuickPhrasesSettingsPage,
});
