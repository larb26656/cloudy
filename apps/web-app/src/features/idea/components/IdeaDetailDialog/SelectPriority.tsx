import type { IdeaPriority } from "@/features/idea/types";
import { PriorityBadge } from "@/features/idea/components";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@cloudy/ui";

interface SelectPriorityProps {
  value: IdeaPriority;
  onValueChange: (value: IdeaPriority) => void;
}

export function SelectPriority({ value, onValueChange }: SelectPriorityProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v as IdeaPriority)}
    >
      <SelectTrigger className="h-7 w-fit gap-1.5 px-2 text-xs cursor-pointer">
        <PriorityBadge priority={value} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="low">Low</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="high">High</SelectItem>
      </SelectContent>
    </Select>
  );
}
