import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Bot, Ellipsis, Pencil, Trash2 } from "lucide-react";
import { Switch } from "@repo/ui/components/switch";
import type { AgentProviderInstance } from "@/hooks/queries/useAgentProviderSettings";

type Props = {
  provider: AgentProviderInstance;
  onEdit: () => void;
  onRemove: () => void;
  onEnabledChange: (enabled: boolean) => void;
};

export function AgentProviderCard({
  provider,
  onEdit,
  onRemove,
  onEnabledChange,
}: Props) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-center gap-3 px-4 py-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bot aria-hidden="true" className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate">{provider.name}</CardTitle>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {provider.templateId}
          </p>
        </div>
        <Switch
          checked={provider.enabled}
          aria-label={`Enable ${provider.name}`}
          onCheckedChange={onEnabledChange}
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                aria-label={`More actions for ${provider.name}`}
              />
            }
          >
            <Ellipsis aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil aria-hidden="true" />
              Edit provider
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onRemove}>
              <Trash2 aria-hidden="true" />
              Remove provider
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="truncate text-xs text-muted-foreground">
          {provider.baseUrl}
        </p>
      </CardContent>
    </Card>
  );
}
