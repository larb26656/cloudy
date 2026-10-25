import { createFileRoute } from "@tanstack/react-router";
import { QuickPhrasesSettings } from "@/features/settings/components/QuickPhrasesSettings";
import { SettingsDetailHeader } from "@/features/settings/SettingsDetailHeader";
import { BoxContainer } from "@/components/layout/BoxContainer";

function QuickPhrasesSettingsPage() {
  return (
    <div className="min-h-full">
      <SettingsDetailHeader title="Quick Phrases" />
      <BoxContainer variant="settings" className="space-y-8">
        <QuickPhrasesSettings />
      </BoxContainer>
    </div>
  );
}

export const Route = createFileRoute("/settings/quick-phrases")({
  component: QuickPhrasesSettingsPage,
});
