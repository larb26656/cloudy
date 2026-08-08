import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { type ReactNode } from "react";

interface CollapsiblePartProps {
  label: string;
  detail?: string;
  trailing?: ReactNode;
  running?: boolean;
  children: ReactNode;
}

export default function CollapsiblePart({
  label,
  detail,
  trailing,
  running,
  children,
}: CollapsiblePartProps) {
  return (
    <Collapsible className="group">
      <CollapsibleTrigger className="flex justify-start items-center w-full gap-2">
        <span
          className={cn(
            "text-sm",
            running &&
              "bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-[length:200%_100%] bg-clip-text text-transparent animate-gradient",
          )}
        >
          {label}
        </span>
        {detail && (
          <span className="text-muted-foreground text-xs truncate">
            {detail}
          </span>
        )}
        {trailing}
        <ChevronDownIcon
          className={cn(
            "ml-auto transition-opacity opacity-0 group-hover:opacity-100 group-data-[open]:opacity-100 group-data-[open]:rotate-180",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="p-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}
