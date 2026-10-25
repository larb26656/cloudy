import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@repo/ui/components/select";
import { useModels } from "@/hooks/queries/useModels";
import type { ResolvedAgentProviderInfo } from "@repo/contracts";
import { ProviderIcon } from "../provider/ProviderIcon";
import { cn } from "@repo/ui/lib/utils";
import { selectorTriggerVariants } from "./selectorVariants";

interface ProviderSelectorProps {
  providerId: string;
  onChange: (providerId: string) => void;
  variant?: "form" | "chat";
  triggerClassName?: string;
  filterProviders?: (provider: ResolvedAgentProviderInfo) => boolean;
  triggerAriaLabel?: string;
}

export function ProviderSelector({
  providerId,
  onChange,
  variant = "form",
  triggerClassName,
  filterProviders,
  triggerAriaLabel,
}: ProviderSelectorProps) {
  const { data: providers = [] } = useModels();
  const filteredProviders = filterProviders
    ? providers.filter(filterProviders)
    : providers;
  const availableProviders = filteredProviders.length
    ? filteredProviders
    : [{ id: providerId, name: providerId }];
  const providerName =
    availableProviders.find((provider) => provider.id === providerId)?.name ??
    providerId;

  return (
    <Select
      value={providerId}
      onValueChange={(value) => {
        if (!value || value === providerId) return;
        onChange(value);
      }}
    >
      <SelectTrigger
        aria-label={triggerAriaLabel}
        className={cn(selectorTriggerVariants({ variant }), triggerClassName)}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <ProviderIcon providerId={providerId} />
          <span className="truncate">{providerName}</span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {availableProviders.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            <div className="flex items-center gap-2">
              <ProviderIcon providerId={item.id} />
              <span>{item.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
