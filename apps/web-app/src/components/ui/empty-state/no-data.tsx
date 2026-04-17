import { EmptyState } from "./base.tsx";

export function NoData({
  description = "No items found",
  action,
  ...props
}: Omit<Parameters<typeof EmptyState>[0], "icon" | "title">) {
  return (
    <EmptyState
      image="/mascot/404.png"
      title="No data"
      description={description}
      action={action}
      {...props}
    />
  );
}
