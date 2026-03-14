import { Button } from "@/components/ui/button";
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
    <Collapsible className="rounded-md data-[state=open]:bg-muted">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="group w-full justify-start">
          <span>{label}</span>
          {detail && (
            <span className="ml-2 text-muted-foreground text-xs truncate">
              {detail}
            </span>
          )}
          <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}
