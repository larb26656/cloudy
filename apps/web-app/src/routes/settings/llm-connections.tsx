import { createFileRoute } from "@tanstack/react-router";
import { LLMProviderSettings } from "@/features/settings/components/LLMProviderSettings";
import { SettingsDetailHeader } from "@/features/settings/SettingsDetailHeader";

function LLMConnectionsPage() {
  return (
    <div className="min-h-full">
      <SettingsDetailHeader title="LLM Connections" />
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <LLMProviderSettings />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/settings/llm-connections")({
  component: LLMConnectionsPage,
});
