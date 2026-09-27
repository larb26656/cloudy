import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { tabTemplates } from "../tabs/template";

interface AddTabMenuProps {
  onAddTab: (template: (typeof tabTemplates)[number]) => void;
  align?: "start" | "center" | "end";
  showLabel?: boolean;
}

export function AddTabMenu({
  onAddTab,
  align = "end",
  showLabel = false,
}: AddTabMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={
              showLabel
                ? "flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                : "flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            <Plus size={16} />
            {showLabel && <span>New</span>}
          </button>
        }
      />
      <DropdownMenuContent align={align} className="w-40">
        {tabTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <DropdownMenuItem
              key={template.type}
              onClick={() => onAddTab(template)}
            >
              <span className="mr-2 [&>svg]:size-4">
                <Icon />
              </span>
              {template.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
