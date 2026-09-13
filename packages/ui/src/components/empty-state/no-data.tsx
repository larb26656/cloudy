import { Inbox } from "lucide-react";
import { EmptyState } from "./base";

export function NoData({
  description = "No items found",
  action,
  ...props
}: Omit<Parameters<typeof EmptyState>[0], "icon" | "title">) {
  return (
    <EmptyState
      icon={Inbox}
      title="No data"
      description={description}
      action={action}
      {...props}
    />
  );
}
