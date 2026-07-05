import { EmptyState } from "./base.tsx";
import noDataUrl from "/mascot/404.png?url";

export function NoData({
  description = "No items found",
  action,
  ...props
}: Omit<Parameters<typeof EmptyState>[0], "icon" | "title">) {
  return (
    <EmptyState
      image={noDataUrl}
      title="No data"
      description={description}
      action={action}
      {...props}
    />
  );
}
