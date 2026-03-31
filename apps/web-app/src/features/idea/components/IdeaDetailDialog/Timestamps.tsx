import { formatDateTime } from "@/lib/date";
import { Clock } from "lucide-react";
interface TimestampsProps {
  createdAt?: string;
  updatedAt?: string;
}

export function Timestamps({ createdAt, updatedAt }: TimestampsProps) {
  return (
    <>
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="size-3" />
        {createdAt ? formatDateTime(createdAt) : "N/A"}
      </span>
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="size-3" />
        {updatedAt ? formatDateTime(updatedAt) : "N/A"}
      </span>
    </>
  );
}
