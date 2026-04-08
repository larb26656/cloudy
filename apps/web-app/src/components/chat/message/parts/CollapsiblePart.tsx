import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDownIcon } from "lucide-react";
import { type ReactNode } from "react";

interface CollapsiblePartProps {
  label: string;
  detail?: string;
  trailing?: ReactNode;
  children: ReactNode;
}

export default function CollapsiblePart({
  label,
  detail,
  trailing,
  children,
}: CollapsiblePartProps) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex justify-start items-center w-full gap-2">
        <span className="text-sm">{label}</span>
        {detail && (
          <span className="text-muted-foreground text-xs truncate">
            {detail}
          </span>
        )}
        {trailing}
        <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="p-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}
