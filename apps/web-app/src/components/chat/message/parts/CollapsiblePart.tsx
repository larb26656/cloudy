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
  children: ReactNode;
}

export default function CollapsiblePart({
  label,
  detail,
  children,
}: CollapsiblePartProps) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex justify-start items-center w-full">
        <span className="text-sm">{label}</span>
        {detail && (
          <span className="ml-2 text-muted-foreground text-xs truncate">
            {detail}
          </span>
        )}
        <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="p-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}
