import { Bot, Cpu, Radio } from "lucide-react";
import { useAgents } from "@/hooks/queries/useAgents";
import { useModels } from "@/hooks/queries/useModels";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { useDefaultAgentStore } from "@/stores/defaultAgentStore";
import { useDefaultModelStore } from "@/stores/defaultModelStore";
import { useDefaultProviderStore } from "@/stores/defaultProviderStore";

const DEFAULT_VALUE = "__default__";

export function AgentModelSettings() {
  const { data: allProviders = [] } = useModels();
  const providerId = useDefaultProviderStore(
    (state) => state.defaultProviderId,
  );
  const setDefaultProvider = useDefaultProviderStore(
    (state) => state.setDefaultProvider,
  );
  const { data: agents = [] } = useAgents({ providerId });
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
  const defaultModelValue = defaultModel
    ? `${defaultModel.providerId}:${defaultModel.modelId}`
    : DEFAULT_VALUE;

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
        <Select
          value={providerId}
          onValueChange={(value) => value && setDefaultProvider(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(allProviders.length
              ? allProviders
              : [{ id: "opencode", name: "OpenCode" }]
            ).map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Select
          value={defaultAgent ?? DEFAULT_VALUE}
          onValueChange={(value) =>
            setDefaultAgent(providerId, value === DEFAULT_VALUE ? null : value)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT_VALUE}>No default agent</SelectItem>
            {agents.map((agent) => (
              <SelectItem key={agent.name} value={agent.name}>
                {agent.providerId
                  ? `${agent.name} (${agent.providerId})`
                  : agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Select
          value={defaultModelValue}
          onValueChange={(value) => {
            if (value === DEFAULT_VALUE) {
              setDefaultModel(providerId, null);
              return;
            }
            const model = providers
              .flatMap((provider) => provider.models ?? [])
              .find(
                (candidate) =>
                  `${candidate.providerId}:${candidate.modelId}` === value,
              );
            if (model) setDefaultModel(providerId, model);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT_VALUE}>No default model</SelectItem>
            {providers.map((provider) => (
              <SelectGroup key={provider.id}>
                <SelectLabel>{provider.name}</SelectLabel>
                {(provider.models ?? []).map((model) => (
                  <SelectItem
                    key={`${model.providerId}:${model.modelId}`}
                    value={`${model.providerId}:${model.modelId}`}
                  >
                    {model.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
