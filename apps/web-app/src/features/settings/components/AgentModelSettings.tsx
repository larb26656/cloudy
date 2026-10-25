import { Bot, Cpu, Radio } from "lucide-react";
import { useModels } from "@/hooks/queries/useModels";
import { ProviderSelector } from "@/components/chat/ProviderSelector";
import { AgentSelector } from "@/components/chat/AgentSelector";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { useDefaultAgentStore } from "@/stores/defaultAgentStore";
import { useDefaultModelStore } from "@/stores/defaultModelStore";
import { useDefaultProviderStore } from "@/stores/defaultProviderStore";

export function AgentModelSettings() {
  const providerId = useDefaultProviderStore(
    (state) => state.defaultProviderId,
  );
  const setDefaultProvider = useDefaultProviderStore(
    (state) => state.setDefaultProvider,
  );
  const { data: providers = [] } = useModels(providerId);
  const defaultAgent = useDefaultAgentStore(
    (state) => state.defaultAgents[providerId] ?? null,
  );
  const setDefaultAgent = useDefaultAgentStore(
    (state) => state.setDefaultAgent,
  );
  const defaultModel = useDefaultModelStore(
    (state) => state.defaultModels[providerId] ?? null,
  );
  const setDefaultModel = useDefaultModelStore(
    (state) => state.setDefaultModel,
  );
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Agent & Model</h2>
        <p className="text-sm text-muted-foreground">
          Set the defaults used when a chat has no session-specific selection.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <Radio className="size-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Provider</p>
            <p className="text-xs text-muted-foreground">
              New chats use this provider. Defaults below are scoped to it.
            </p>
          </div>
        </div>
        <ProviderSelector
          providerId={providerId}
          variant="form"
          onChange={setDefaultProvider}
        />
        <p className="text-xs text-muted-foreground">
          {providers.length ? "Connected" : "Not configured or unavailable"}
        </p>
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <Bot className="size-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Default Agent</p>
            <p className="text-xs text-muted-foreground">
              Used by new chats unless you choose a different agent.
            </p>
          </div>
        </div>
        <AgentSelector
          variant="form"
          providerId={providerId}
          value={defaultAgent}
          onChange={(agent) => setDefaultAgent(providerId, agent)}
        />
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <Cpu className="size-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Default Model</p>
            <p className="text-xs text-muted-foreground">
              Used by new chats unless you choose a different model.
            </p>
          </div>
        </div>
        <ModelSelector
          variant="form"
          providerId={providerId}
          value={defaultModel}
          onChange={(model) => setDefaultModel(providerId, model)}
        />
      </div>
    </div>
  );
}
