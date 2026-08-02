import { Bot, Cpu } from "lucide-react";
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
} from "@/components/ui/select";
import { useDefaultAgentStore } from "@/stores/defaultAgentStore";
import { useDefaultModelStore } from "@/stores/defaultModelStore";

const DEFAULT_VALUE = "__default__";

export function AgentModelSettings() {
  const { data: agents = [] } = useAgents();
  const { data: providers = [] } = useModels();
  const defaultAgent = useDefaultAgentStore((state) => state.defaultAgent);
  const setDefaultAgent = useDefaultAgentStore(
    (state) => state.setDefaultAgent,
  );
  const defaultModel = useDefaultModelStore((state) => state.defaultModel);
  const setDefaultModel = useDefaultModelStore(
    (state) => state.setDefaultModel,
  );
  const defaultModelValue = defaultModel
    ? `${defaultModel.providerID}:${defaultModel.modelID}`
    : DEFAULT_VALUE;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Agent & Model</h2>
        <p className="text-sm text-muted-foreground">
          Set the defaults used when a chat has no session-specific selection.
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
            setDefaultAgent(value === DEFAULT_VALUE ? null : value)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT_VALUE}>No default agent</SelectItem>
            {agents.map((agent) => (
              <SelectItem key={agent.name} value={agent.name}>
                {agent.name}
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
              setDefaultModel(null);
              return;
            }
            const model = providers
              .flatMap((provider) => provider.models)
              .find(
                (candidate) =>
                  `${candidate.providerID}:${candidate.modelID}` === value,
              );
            if (model) setDefaultModel(model);
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
                {provider.models.map((model) => (
                  <SelectItem
                    key={`${model.providerID}:${model.modelID}`}
                    value={`${model.providerID}:${model.modelID}`}
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
