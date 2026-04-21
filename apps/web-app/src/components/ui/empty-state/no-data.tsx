import { EmptyState } from "./base.tsx";
import notFound from "@/assets/mascot/404.png";

export function NoData({
  description = "No items found",
  action,
  ...props
}: Omit<Parameters<typeof EmptyState>[0], "icon" | "title">) {
  return (
    <EmptyState
      image={notFound}
      title="No data"
      description={description}
      action={action}
      {...props}
    />
  );
}
