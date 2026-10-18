import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Cpu, Ellipsis, Pencil, Sparkles, Trash2 } from "lucide-react";
import type {
  LLMConnection,
  LLMSettings,
} from "@/hooks/queries/useLLMConnectionSettings";

type Props = {
  connection: LLMConnection;
  providerTypes: LLMSettings["providerTypes"];
  onEdit: () => void;
  onRemove: () => void;
};

export function LLMConnectionCard({
  connection,
  providerTypes,
  onEdit,
  onRemove,
}: Props) {
  const provider = providerTypes.find((item) => item.id === connection.type);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-center gap-3 px-4 py-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <span className="relative flex size-6 items-center justify-center">
            <Cpu aria-hidden="true" className="size-6" />
            <Sparkles
              aria-hidden="true"
              className="absolute -right-1 -top-1 size-3 fill-background"
            />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <CardTitle className="min-w-0 truncate">
              {connection.name}
            </CardTitle>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {provider?.name ?? connection.type}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                aria-label={`More actions for ${connection.name}`}
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
        <p className="text-xs text-muted-foreground">
          {connection.modelIds.length}{" "}
          {connection.modelIds.length === 1 ? "model" : "models"} available
        </p>
      </CardContent>
    </Card>
  );
}
