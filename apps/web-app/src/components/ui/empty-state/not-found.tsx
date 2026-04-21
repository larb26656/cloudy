import { EmptyState } from "./base.tsx";
import notFound from "@/assets/mascot/404.png";

export function NotFound({
  description = "The page or resource you're looking for doesn't exist",
  action,
  ...props
}: Omit<Parameters<typeof EmptyState>[0], "icon" | "title">) {
  return (
    <EmptyState
      image={notFound}
      title="Page not found"
      description={description}
      action={action}
      {...props}
    />
  );
}
