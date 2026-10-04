import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@repo/ui/components/select";
import { useModels } from "@/hooks/queries/useModels";
import { ProviderIcon } from "../provider/ProviderIcon";

interface ProviderSelectorProps {
  providerId: string;
  onChange: (providerId: string) => void;
}

export function ProviderSelector({
  providerId,
  onChange,
}: ProviderSelectorProps) {
  const { data: providers = [] } = useModels();
  const availableProviders = providers.length
    ? providers
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
      <SelectTrigger className="h-8 w-auto gap-2 border-0 px-2 text-xs shadow-none">
        <ProviderIcon providerId={providerId} />
        <span className="max-w-40 truncate">{providerName}</span>
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
