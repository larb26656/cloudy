import { createFileRoute } from "@tanstack/react-router";
import { LLMConnectionSettings } from "@/features/settings/components/LLMConnectionSettings";
import { SettingsDetailHeader } from "@/features/settings/SettingsDetailHeader";
import { BoxContainer } from "@/components/layout/BoxContainer";

function LLMConnectionsPage() {
  return (
    <div className="min-h-full">
      <SettingsDetailHeader title="LLM Connections" />
      <BoxContainer variant="settings">
        <LLMConnectionSettings />
      </BoxContainer>
    </div>
  );
}

export const Route = createFileRoute("/settings/llm-connections")({
  component: LLMConnectionsPage,
});
