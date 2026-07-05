import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { contextProviders } from "./contextRegistry";

export function ContextSelector() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            size="icon-sm"
            variant={"outline"}
            className="rounded-full p-4"
            title="Add context"
          >
            <Plus className="size-5" />
          </Button>
        }
      >
        <span>Context</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {contextProviders.map((provider) => {
          const Icon = provider.icon;
          return (
            <DropdownMenuItem
              key={provider.type}
              onClick={() => provider.handler()}
            >
              <Icon className="size-4 mr-2" />
              {provider.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}