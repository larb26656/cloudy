import { EmptyState } from "./base.tsx";
import notFoundUrl from "/mascot/404.png?url";

export function NotFound({
  description = "The page or resource you're looking for doesn't exist",
  action,
  ...props
}: Omit<Parameters<typeof EmptyState>[0], "icon" | "title">) {
  return (
    <EmptyState
      image={notFoundUrl}
      title="Page not found"
      description={description}
      action={action}
      {...props}
    />
  );
}
