import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import type {
  LLMConnection,
  LLMSettings,
} from "@/hooks/queries/useLLMProviderSettings";

type Props = {
  connection: LLMConnection;
  providerTypes: LLMSettings["providerTypes"];
  defaultModelId?: string;
  isDefault: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onSetDefault: (modelId: string) => void;
};

export function LLMConnectionCard({
  connection,
  providerTypes,
  defaultModelId,
  isDefault,
  onEdit,
  onRemove,
  onSetDefault,
}: Props) {
  const provider = providerTypes.find((item) => item.id === connection.type);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{connection.name}</CardTitle>
        <CardAction>
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
        </CardAction>
        <p className="text-sm text-muted-foreground">
          {provider?.name ?? connection.type}
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {connection.modelIds.map((model) => (
          <span
            key={model}
            className="max-w-full truncate rounded-md border bg-muted px-2 py-1 text-xs"
            title={model}
          >
            {model}
          </span>
        ))}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex min-w-0 items-center gap-2 text-sm">
          <span className="shrink-0">Default model</span>
          <Select
            value={isDefault ? (defaultModelId ?? null) : null}
            onValueChange={(modelId) => modelId && onSetDefault(modelId)}
          >
            <SelectTrigger
              aria-label={`${connection.name} default model`}
              className="min-w-0"
            >
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {connection.modelIds.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          Remove
        </Button>
      </CardFooter>
    </Card>
  );
}
