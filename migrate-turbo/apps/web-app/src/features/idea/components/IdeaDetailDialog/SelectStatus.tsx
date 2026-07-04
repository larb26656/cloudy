import type { IdeaStatus } from "@/features/idea/types";
import { StatusBadge } from "@/features/idea/components";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

interface SelectStatusProps {
  value: IdeaStatus;
  onValueChange: (value: IdeaStatus) => void;
}

export function SelectStatus({ value, onValueChange }: SelectStatusProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as IdeaStatus)}>
      <SelectTrigger className="h-7 w-fit gap-1.5 px-2 text-xs cursor-pointer">
        <StatusBadge status={value} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="draft">Draft</SelectItem>
        <SelectItem value="in-progress">In Progress</SelectItem>
        <SelectItem value="completed">Completed</SelectItem>
        <SelectItem value="archived">Archived</SelectItem>
      </SelectContent>
    </Select>
  );
}
